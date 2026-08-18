import { NextRequest } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { trackUsageSchema } from '@/lib/validation'
import { User } from '@/lib/db'
import { ensureGuestId, getGuestUsage, incrementGuestUsage, GUEST_COOKIE_NAME } from '@/lib/guest-usage'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

const GUEST_LIMIT = 3
const RATE_LIMIT_WINDOW = 60_000

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'usage:track', 60, RATE_LIMIT_WINDOW)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = trackUsageSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { isAuthenticated } = parsed.data

  if (isAuthenticated) {
    const who = await auth(request)
    if ('error' in who) return who.error

    const user = await User.findByIdAndUpdate(
      who.user.id,
      { $inc: { conversionsUsed: 1 } },
      { new: true }
    )

    if (!user) {
      return errorResponse(404, '', '', undefined, request)
    }

    return successResponse({
      conversionsUsed: user.conversionsUsed,
      remaining: null,
      isUnlimited: true,
    })
  }

  const { guestId, setCookie } = ensureGuestId(request)
  if (!guestId) {
    return errorResponse(400, '', '', undefined, request)
  }
  const usage = await incrementGuestUsage(guestId)
  const remaining = Math.max(0, GUEST_LIMIT - usage)

  const res = successResponse({
    conversionsUsed: usage,
    remaining,
    isUnlimited: false,
    limitReached: usage >= GUEST_LIMIT,
  })
  if (setCookie) {
    res.cookies.set(GUEST_COOKIE_NAME, setCookie.value, {
      httpOnly: true,
      secure: setCookie.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: setCookie.maxAge,
    })
  }
  return res
}

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'usage:check', 120, RATE_LIMIT_WINDOW)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const authHeader = request.headers.get('authorization')
  const isAuthenticated = authHeader?.toLowerCase().startsWith('bearer ')

  if (isAuthenticated) {
    const who = await auth(request)
    if ('error' in who) return who.error

    const user = await User.findById(who.user.id)

    if (!user) {
      return errorResponse(404, '', '', undefined, request)
    }

    return successResponse({
      conversionsUsed: user.conversionsUsed,
      remaining: null,
      isUnlimited: true,
    })
  }

  const { guestId, setCookie } = ensureGuestId(request)
  if (!guestId) {
    return errorResponse(400, '', '', undefined, request)
  }

  const usage = await getGuestUsage(guestId)
  const remaining = Math.max(0, GUEST_LIMIT - usage)

  const res = successResponse({
    conversionsUsed: usage,
    remaining,
    isUnlimited: false,
    limitReached: usage >= GUEST_LIMIT,
  })
  if (setCookie) {
    res.cookies.set(GUEST_COOKIE_NAME, setCookie.value, {
      httpOnly: true,
      secure: setCookie.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: setCookie.maxAge,
    })
  }
  return res
}
