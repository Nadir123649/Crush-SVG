import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { rotateSession } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { Session, User } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'auth:refresh', 120, 60_000)
  if (!rl.allowed) {
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

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, version: '1.0.0', payload: { error: { code: 'token_missing' } }, serverTimestamp: new Date().toISOString() },
      { status: 200, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken)

    const result = await rotateSession(decoded.jti, decoded.ver ?? 0, decoded.id)

    if (!result.rotated) {
      const current = await Session.findOne({ _id: decoded.jti })
      const sessionActive =
        !!current &&
        current.status === 'active' &&
        current.userId.toString() === decoded.id
      if (!sessionActive) {
        const res = NextResponse.json(
          { success: false, version: '1.0.0', payload: { error: { code: 'session_revoked' } }, serverTimestamp: new Date().toISOString() },
          { status: 401, headers: rateLimitHeaders(rl) }
        )
        res.cookies.delete(REFRESH_COOKIE_NAME)
        return res
      }
    }

    const currentVersion = result.currentVersion
    const remember = result.remember

    const user = await User.findById(decoded.id)
    if (!user) {
      const res = NextResponse.json(
        { success: false, version: '1.0.0', payload: { error: { code: 'user_not_found' } }, serverTimestamp: new Date().toISOString() },
        { status: 401, headers: rateLimitHeaders(rl) }
      )
      res.cookies.delete(REFRESH_COOKIE_NAME)
      return res
    }

    const tokenPair = buildTokenPayload({
      id: user._id.toString(),
      role: 'free',
      sessionId: decoded.jti,
      tokenVersion: currentVersion,
    })
    const res = NextResponse.json(
      {
        success: true,
        version: '1.0.0',
        payload: { token: tokenPair },
        serverTimestamp: new Date().toISOString(),
      },
      { status: 200, headers: rateLimitHeaders(rl) }
    )
    res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 7 * 24 * 60 * 60 : undefined,
    })
    return res
  } catch {
    const res = NextResponse.json(
      { success: false, version: '1.0.0', payload: { error: { code: 'token_invalid' } }, serverTimestamp: new Date().toISOString() },
      { status: 200, headers: rateLimitHeaders(rl) }
    )
    res.cookies.delete(REFRESH_COOKIE_NAME)
    return res
  }
}
