import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/middleware/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { AuditLog } from '@/lib/database/db'
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
  const rl = await checkRateLimit(request, 'admin:audits:list', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  const adminCheck = await requireAdmin(who)
  if ('error' in adminCheck) return adminCheck.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit
  const search = searchParams.get('search')?.trim()

  const filter: Record<string, unknown> = {}
  if (search) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
    
    const filterOr: any[] = [
      { action: { $regex: search, $options: 'i' } },
      { adminId: { $regex: search, $options: 'i' } },
      { resourceType: { $regex: search, $options: 'i' } },
      { target: { $regex: search, $options: 'i' } },
      { ipAddress: { $regex: search, $options: 'i' } },
      { "details.email": { $regex: search, $options: 'i' } },
      { "details.newRole": { $regex: search, $options: 'i' } },
      { "details.oldRole": { $regex: search, $options: 'i' } },
      { "details.role": { $regex: search, $options: 'i' } },
      { "details.newDisplayName": { $regex: search, $options: 'i' } },
      { "details.message": { $regex: search, $options: 'i' } },
      { "details.error": { $regex: search, $options: 'i' } },
      { $expr: { $regexMatch: { input: { $toString: "$createdAt" }, regex: search, options: "i" } } }
    ];

    const searchLower = search.toLowerCase();
    if (searchLower === 'error' || searchLower === 'fail') {
      filterOr.push({ action: { $regex: 'fail|error', $options: 'i' } });
    } else if (searchLower === 'warning' || searchLower === 'warn') {
      filterOr.push({ action: { $regex: 'warn|limit|suspend|delete', $options: 'i' } });
    } else if (searchLower === 'info') {
      filterOr.push({ action: { $not: { $regex: 'fail|error|warn|limit|suspend|delete', $options: 'i' } } });
    }
    
    if (isObjectId) {
      filterOr.push(
        { resourceId: search },
        { target: search }
      );
    }
    
    filter.$or = filterOr;
  }

  const [total, docs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])

  return successResponse({
    data: docs,
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