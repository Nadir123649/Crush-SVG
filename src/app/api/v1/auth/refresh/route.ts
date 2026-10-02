import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from '@/lib/security/rate-limit'
import { rotateSession, wasSessionRotatedWithin } from '@/lib/auth/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/auth/tokens'
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions, clearRefreshCookie } from '@/lib/auth/auth'
import { toUserDTO } from '@/lib/auth/auth'
import { Session, User, connectToDatabase } from '@/lib/database/db'
import { getFreshPhotoURL } from '@/lib/firebase/firebase-admin'
import { logger } from '@/lib/shared/logger'

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
  clearRefreshCookie(res)
  return res
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return { errName: err.name, errMessage: err.message, errStack: err.stack }
  }
  return { errRaw: String(err) }
}

async function handleRefresh(request: NextRequest): Promise<NextResponse> {
  // connectToDatabase caches the connection on globalThis — safe to call per
  // request; it only opens a new connection on a cold start.
  await connectToDatabase()

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

  // Validate both IDs before any DB lookup. Both Session._id and User._id are
  // ObjectId; Mongoose throws CastError on a non-24-hex string.
  if (
    !mongoose.isValidObjectId(decoded.jti) ||
    !mongoose.isValidObjectId(decoded.id)
  ) {
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

  // Refresh Google profile photoURL if the user has a Google provider.
  // Google profile picture URLs contain session tokens that expire; fetching
  // a fresh URL on each refresh keeps the avatar current.
  const hasGoogleProvider = user.providers?.some(
    (p) => p === 'google' || p === 'google.com'
  )
  if (hasGoogleProvider && user.uid) {
    const freshPhoto = await getFreshPhotoURL(user.uid)
    if (freshPhoto && freshPhoto !== user.photoURL) {
      await User.updateOne(
        { _id: user._id },
        { $set: { photoURL: freshPhoto } }
      ).catch(() => {})
      user.photoURL = freshPhoto
    }
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
  res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, getRefreshCookieOptions(result.remember))
  return res
}

export async function POST(request: NextRequest) {
  try {
    return await handleRefresh(request)
  } catch (err) {
    logger.error('refresh_unhandled_error', {
      requestId: request.headers.get('x-request-id'),
      ...serializeError(err),
    })
    // Do NOT clear the refresh cookie on 500 — the error may be transient and
    // clearing it would permanently log out a valid user.
    return NextResponse.json(
      {
        success: false,
        version: '1.0.0',
        payload: { error: { code: 'server_error' } },
        serverTimestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
