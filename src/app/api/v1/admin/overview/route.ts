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
      User.countDocuments(VALID_USER_FILTER).catch(() => 0),
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
      ]).hint({ success: 1, inputFormat: 1 }).then(r => r[0] ?? { total: 0, raster: 0, svg: 0 }).catch(async () => {
        const r = await ConversionLog.aggregate([
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
        ]).catch(() => []);
        return r[0] ?? { total: 0, raster: 0, svg: 0 };
      }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean().catch(() => []),
      ConversionLog.find().sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      ConversionLog.aggregate([
        { $match: { success: true, createdAt: { $gte: tenDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]).catch(() => [])
    ]);

    const totalConversions = (conversionTotals as any)?.total ?? 0;
    const rasterConversions = (conversionTotals as any)?.raster ?? 0;
    const svgConversions = (conversionTotals as any)?.svg ?? 0;

    // Resolve user details for recent conversions cleanly without unindexed populate
    const userIds = (rawRecentConversions as any[]).map((c) => c.userId).filter(Boolean);
    const userMap = new Map<string, any>();
    if (userIds.length > 0) {
      try {
        const users = await User.find({ uid: { $in: userIds } }, { uid: 1, email: 1, displayName: 1, photoURL: 1 }).lean();
        users.forEach((u: any) => userMap.set(u.uid, u));
      } catch {}
    }

    const recentConversions = (rawRecentConversions as any[]).map((c: any) => ({
      ...c,
      _id: c._id?.toString() || '',
      userId: userMap.get(c.userId) || c.userId || 'Guest',
    }));

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
