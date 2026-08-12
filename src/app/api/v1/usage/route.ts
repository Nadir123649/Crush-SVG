import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { trackUsageSchema } from '@/lib/validation'
import { getUsersCollection } from '@/lib/db'
import { getGuestUsage, incrementGuestUsage } from '@/lib/guest-usage'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

const GUEST_LIMIT = 3
const RATE_LIMIT_WINDOW = 60_000

function getGuestId(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return request.headers.get('cf-connecting-ip')
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('usage:track', 60, RATE_LIMIT_WINDOW)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many usage tracking requests. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = trackUsageSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { guestId, isAuthenticated } = parsed.data

  if (isAuthenticated) {
    const who = await auth(request)
    if ('error' in who) return who.error

    const users = await getUsersCollection()
    const user = await users.findOneAndUpdate(
      { _id: new ObjectId(who.user.id) },
      { $inc: { conversionsUsed: 1 } },
      { returnDocument: 'after' }
    )

    if (!user) {
      return errorResponse(404, 'user_not_found', 'User not found')
    }

    return successResponse({
      conversionsUsed: user.conversionsUsed,
      remaining: Math.max(0, GUEST_LIMIT - user.conversionsUsed),
      isUnlimited: true,
    })
  }

  if (!guestId) {
    const clientIp = getGuestId(request)
    if (!clientIp) {
      return errorResponse(400, 'validation_error', 'Unable to identify client')
    }
    const usage = await incrementGuestUsage(clientIp)
    const remaining = Math.max(0, GUEST_LIMIT - usage)

    return successResponse({
      conversionsUsed: usage,
      remaining,
      isUnlimited: false,
      limitReached: usage >= GUEST_LIMIT,
    })
  }

  const usage = await getGuestUsage(guestId)
  const remaining = Math.max(0, GUEST_LIMIT - usage)

  return successResponse({
    conversionsUsed: usage,
    remaining,
    isUnlimited: false,
    limitReached: usage >= GUEST_LIMIT,
  })
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('usage:check', 120, RATE_LIMIT_WINDOW)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many usage check requests. Try again later.')
  }

  const authHeader = request.headers.get('authorization')
  const isAuthenticated = authHeader?.toLowerCase().startsWith('bearer ')

  if (isAuthenticated) {
    const who = await auth(request)
    if ('error' in who) return who.error

    const users = await getUsersCollection()
    const user = await users.findOne({ _id: new ObjectId(who.user.id) })

    if (!user) {
      return errorResponse(404, 'user_not_found', 'User not found')
    }

    return successResponse({
      conversionsUsed: user.conversionsUsed,
      remaining: Math.max(0, GUEST_LIMIT - user.conversionsUsed),
      isUnlimited: true,
    })
  }

  const guestId = getGuestId(request)
  if (!guestId) {
    return errorResponse(400, 'validation_error', 'Unable to identify client')
  }

  const usage = await getGuestUsage(guestId)
  const remaining = Math.max(0, GUEST_LIMIT - usage)

  return successResponse({
    conversionsUsed: usage,
    remaining,
    isUnlimited: false,
    limitReached: usage >= GUEST_LIMIT,
  })
}