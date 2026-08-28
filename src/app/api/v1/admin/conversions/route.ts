import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/middleware/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { User, ConversionLog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'

export const runtime = 'nodejs'

async function requireAdmin(who: { user: { id: string; role: string } } | { error: Response }): Promise<{ user: { id: string; role: string } } | { error: Response }> {
  if ('error' in who) return who
  if (who.user.role !== 'admin') {
    return { error: NextResponse.json({ error: { code: 'forbidden', message: 'Admin access required' } }, { status: 403 }) }
  }
  return who
}

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:conversions:list', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  const adminCheck = await requireAdmin(who)
  if ('error' in adminCheck) return adminCheck.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '15')))
  const skip = (page - 1) * limit
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const filter: Record<string, any> = {};
  
  if (status === 'success') filter.success = true
  else if (status === 'failed') filter.success = false

  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }

  const [total, docs] = await Promise.all([
    ConversionLog.countDocuments(filter),
    ConversionLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])

  const userIds = [...new Set(docs.map((d: any) => d.userId).filter(Boolean))];
  const users = userIds.length > 0
    ? await User.find({ _id: { $in: userIds } }).select('uid email displayName photoURL').lean()
    : [];
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
  const enrichedDocs = docs.map((d: any) => ({
    ...d.toObject(),
    userId: d.userId ? userMap.get(d.userId) || null : null,
  }))

  return successResponse({
    data: enrichedDocs,
    meta: {
      total,
      page,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  })
}