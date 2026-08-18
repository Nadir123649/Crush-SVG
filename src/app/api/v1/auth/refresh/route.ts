import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit'
import { rotateSession } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { Session, User } from '@/lib/db'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

function rateLimitedResponse(rl: RateLimitResult) {
  return NextResponse.json(
    {
      success: false,
      version: '1.0.0',
      payload: { error: { code: 'rate_limited' } },
      serverTimestamp: new Date().toISOString(),
      retryAfterSeconds: rl.retryAfterSeconds,
    },
    { status: 429, headers: rateLimitHeaders(rl) }
  )
}

function errorResponse(code: string, status: number, rl: RateLimitResult) {
  const res = NextResponse.json(
    {
      success: false,
      version: '1.0.0',
      payload: { error: { code } },
      serverTimestamp: new Date().toISOString(),
    },
    { status, headers: rateLimitHeaders(rl) }
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'auth:refresh', 120, 60_000)
  if (!rl.allowed) {
    return rateLimitedResponse(rl)
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  if (!refreshToken) {
    return NextResponse.json(
      {
        success: false,
        version: '1.0.0',
        payload: { error: { code: 'token_missing' } },
        serverTimestamp: new Date().toISOString(),
      },
      { status: 200, headers: rateLimitHeaders(rl) }
    )
  }

  let decoded
  try {
    decoded = await verifyRefreshToken(refreshToken)
  } catch {
    return errorResponse('token_invalid', 200, rl)
  }

  const result = await rotateSession(decoded.jti, decoded.ver ?? 0, decoded.id)

  if (!result.rotated) {
    // Either the session is gone/inactive, or the token version did not match —
    // the latter indicates the refresh token was reused (potentially stolen).
    // Treat any failed rotation as invalid and revoke the session.
    await Session.updateOne(
      { _id: decoded.jti, userId: decoded.id },
      { $set: { status: 'revoked' } }
    ).catch(() => {})
    logger.warn('refresh_rotation_failed', {
      sessionId: decoded.jti,
      userId: decoded.id,
      requestId: request.headers.get('x-request-id'),
    })
    return errorResponse('session_revoked', 401, rl)
  }

  const user = await User.findById(decoded.id)
  if (!user) {
    return errorResponse('user_not_found', 401, rl)
  }

  const tokenPair = buildTokenPayload({
    id: user._id.toString(),
    role: user.role ?? 'user',
    sessionId: decoded.jti,
    tokenVersion: result.currentVersion,
  })

  const res = NextResponse.json(
    {
      success: true,
      version: '1.0.0',
      payload: { token: tokenPair, sessionId: decoded.jti },
      serverTimestamp: new Date().toISOString(),
    },
    { status: 200, headers: rateLimitHeaders(rl) }
  )
  res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: result.remember ? 7 * 24 * 60 * 60 : undefined,
  })
  return res
}
