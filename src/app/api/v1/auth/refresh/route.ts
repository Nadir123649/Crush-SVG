import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionsCollection, rotateSession } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { getUsersCollection } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:refresh', 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        version: '1.0.0',
        payload: { error: { code: 'rate_limited' } },
        serverTimestamp: new Date().toISOString(),
        retryAfterSeconds: rl.retryAfterSeconds,
      },
      { status: 429 }
    )
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, version: '1.0.0', payload: { error: { code: 'token_missing' } }, serverTimestamp: new Date().toISOString() },
      { status: 200 }
    )
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken)

    const sessions = await getSessionsCollection()
    const result = await rotateSession(
      sessions,
      decoded.jti,
      decoded.ver ?? 0,
      new (await import('mongodb')).ObjectId(decoded.id)
    )

    if (!result.rotated) {
      const current = await sessions.findOne({
        _id: new (await import('mongodb')).ObjectId(decoded.jti),
      })
      const sessionActive =
        !!current &&
        current.status === 'active' &&
        current.userId.toString() === decoded.id
      if (!sessionActive) {
        const res = NextResponse.json(
          { success: false, version: '1.0.0', payload: { error: { code: 'session_revoked' } }, serverTimestamp: new Date().toISOString() },
          { status: 401 }
        )
        res.cookies.delete(REFRESH_COOKIE_NAME)
        return res
      }
    }

    const currentVersion = result.currentVersion
    const remember = result.remember

    const users = await getUsersCollection()
    const user = await users.findOne({ _id: new (await import('mongodb')).ObjectId(decoded.id) })
    if (!user) {
      const res = NextResponse.json(
        { success: false, version: '1.0.0', payload: { error: { code: 'user_not_found' } }, serverTimestamp: new Date().toISOString() },
        { status: 401 }
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
      { success: true, payload: { token: tokenPair }, timestamp: Date.now() },
      { status: 200 }
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
      { status: 200 }
    )
    res.cookies.delete(REFRESH_COOKIE_NAME)
    return res
  }
}
