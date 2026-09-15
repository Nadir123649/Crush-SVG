import { NextRequest } from "next/server";
import { User, ConversionLog, AuditLog, VALID_USER_FILTER } from "@/lib/database/db";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { auth } from '@/lib/middleware/auth-middleware';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const who = await auth(request);
    if ('error' in who) return who.error;
    if (who.user.role !== 'admin') {
      return errorResponse(403, "forbidden", "Admin access required", undefined, request);
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const [
      totalUsers,
      conversionTotals,
      recentAudits,
      rawRecentConversions,
      conversionsLast10Days
    ] = await Promise.all([
      User.aggregate([
        { $match: VALID_USER_FILTER },
        { $count: "total" }
      ]).then(r => r[0]?.total ?? 0).catch(() => 0),
      ConversionLog.aggregate([
        { $match: { success: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            raster: {
              $sum: {
                $cond: [{ $in: ["$inputFormat", ["png", "jpg", "jpeg", "webp"]] }, 1, 0]
              }
            },
            svg: {
              $sum: {
                $cond: [{ $eq: ["$inputFormat", "svg"] }, 1, 0]
              }
            }
          }
        }
      ]).then(r => r[0] ?? { total: 0, raster: 0, svg: 0 }).catch(() => ({ total: 0, raster: 0, svg: 0 })),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      ConversionLog.find().sort({ createdAt: -1 }).limit(5).lean(),
      ConversionLog.aggregate([
        { $match: { success: true, createdAt: { $gte: tenDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalConversions = (conversionTotals as any)?.total ?? 0;
    const rasterConversions = (conversionTotals as any)?.raster ?? 0;
    const svgConversions = (conversionTotals as any)?.svg ?? 0;

    const userIds = [...new Set(rawRecentConversions.map((c: any) => c.userId).filter(Boolean))];
    const conversionUsers = userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).select('uid email displayName photoURL').lean()
      : [];
    const userMap = new Map(conversionUsers.map((u: any) => [u._id.toString(), u]));
    
    const recentConversions = rawRecentConversions.map((c: any) => {
      const obj = c.toObject ? c.toObject() : { ...c, _id: c._id?.toString() };
      return {
        ...obj,
        _id: obj._id?.toString() || '',
        userId: obj.userId ? userMap.get(obj.userId) || null : null,
      };
    });

    return successResponse({
      totalUsers,
      totalConversions,
      rasterConversions,
      svgConversions,
      recentAudits,
      recentConversions,
      conversionsLast10Days
    });
  } catch (error: any) {
    console.error("Dashboard overview error:", error);
    return errorResponse(500, "internal_error", "Failed to load dashboard data");
  }
}
