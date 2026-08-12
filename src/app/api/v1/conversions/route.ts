import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { conversionHistoryQuerySchema } from '@/lib/validation'
import { getUsersCollection } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('conversions:history', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
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
    return errorResponse(400, 'validation_error', 'Invalid query parameters')
  }

  const { page, limit, sort } = parsed.data
  const skip = (page - 1) * limit
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort
  const sortOrder = sort.startsWith('-') ? -1 : 1

  const users = await getUsersCollection()
  const user = await users.findOne({ _id: new ObjectId(who.user.id) })

  if (!user) {
    return errorResponse(404, 'user_not_found', 'User not found')
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