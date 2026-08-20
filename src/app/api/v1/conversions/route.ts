import { NextRequest } from 'next/server'

import { auth } from '@/lib/middleware/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { conversionHistoryQuerySchema } from '@/lib/shared/validation'
import { User } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'conversions:history', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  const { searchParams } = new URL(request.url)
  const parsed = conversionHistoryQuerySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    sort: searchParams.get('sort'),
  })

  if (!parsed.success) {
    return errorResponse(400, '', '', undefined, request)
  }

  const { page, limit } = parsed.data

  const user = await User.findById(who.user.id)

  if (!user) {
    return errorResponse(404, '', '', undefined, request)
  }

  const pathname = request.nextUrl.pathname
  const total = 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return successResponse({
    data: [],
    meta: {
      total,
      page,
      per_page: limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
    links: {
      self: request.url,
      first: `${pathname}?page=1&limit=${limit}`,
      last: `${pathname}?page=${totalPages}&limit=${limit}`,
      prev: page > 1 ? `${pathname}?page=${page - 1}&limit=${limit}` : null,
      next: page < totalPages ? `${pathname}?page=${page + 1}&limit=${limit}` : null,
    },
    usage: {
      conversionsUsed: user.conversionsUsed,
      isUnlimited: true,
    },
    message: 'Export history is not stored yet; only the conversion count is tracked.'
  })
}
