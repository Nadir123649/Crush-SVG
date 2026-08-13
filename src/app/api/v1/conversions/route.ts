import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { conversionHistoryQuerySchema } from '@/lib/validation'
import { User } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

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

  const { page, limit, sort } = parsed.data
  const skip = (page - 1) * limit
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort
  const sortOrder = sort.startsWith('-') ? -1 : 1

  const user = await User.findById(who.user.id)

  if (!user) {
    return errorResponse(404, '', '', undefined, request)
  }

  return successResponse({
    data: [],
    meta: {
      total: 0,
      page,
      per_page: limit,
      total_pages: 0,
      has_next: false,
      has_prev: page > 1,
    },
    links: {
      self: request.url,
      first: `${request.nextUrl.pathname}?page=1&limit=${limit}`,
      last: `${request.nextUrl.pathname}?page=1&limit=${limit}`,
    },
    message: 'Conversion history feature coming soon. Currently stores only conversion count.'
  })
}
