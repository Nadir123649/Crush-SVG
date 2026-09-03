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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalConversions,
      rasterConversions,
      svgConversions,
      recentAudits,
      rawRecentConversions,
      conversionsLast7Days
    ] = await Promise.all([
      User.countDocuments(VALID_USER_FILTER),
      ConversionLog.countDocuments({ success: true }),
      ConversionLog.countDocuments({ success: true, inputFormat: { $in: ['png', 'jpg', 'jpeg', 'webp'] } }),
      ConversionLog.countDocuments({ success: true, inputFormat: 'svg' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      ConversionLog.find().sort({ createdAt: -1 }).limit(5),
      ConversionLog.aggregate([
        { $match: { success: true, createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

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
      conversionsLast7Days
    });
  } catch (error: any) {
    console.error("Dashboard overview error:", error);
    return errorResponse(500, "internal_error", "Failed to load dashboard data");
  }
}
