import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit'
import { rotateSession, wasSessionRotatedWithin } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { toUserDTO } from '@/lib/auth'
import { Session, User } from '@/lib/db'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const ROTATION_GRACE_MS = 60_000

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

  let result = await rotateSession(decoded.jti, decoded.ver ?? 0, decoded.id)

  if (!result.rotated) {
    // Version mismatch: either a stolen/reused token, or a benign race from
    // overlapping refreshes (rapid page reloads fire several in parallel).
    // If the session rotated very recently, treat it as a race and reissue
    // tokens at the CURRENT version without bumping again — both racing
    // requests succeed and the user stays logged in.
    const rotatedRecently = await wasSessionRotatedWithin(decoded.jti, ROTATION_GRACE_MS)
    if (!rotatedRecently) {
      // The refresh token was reused outside the grace window (potentially
      // stolen). Treat it as invalid and revoke the session.
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
    result = { rotated: true, currentVersion: result.currentVersion, remember: result.remember }
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
      payload: {
        token: tokenPair,
        sessionId: decoded.jti,
        remember: result.remember,
        user: toUserDTO(user),
      },
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
