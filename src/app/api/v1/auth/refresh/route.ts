import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from '@/lib/security/rate-limit'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/auth/tokens'
import { resolveRole } from '@/lib/auth/roles'
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions, clearRefreshCookie } from '@/lib/auth/auth'
import { toUserDTO } from '@/lib/auth/auth'
import { logger } from '@/lib/shared/logger'

export const runtime = 'nodejs'

const ROTATION_GRACE_MS = 60_000
const RATE_LIMIT = 120
const RATE_WINDOW_MS = 60_000

// Env vars this route cannot work without. Checked per request (not at import)
// so a misconfigured deployment answers with a JSON 500 instead of crashing
// the function before the handler runs.
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const

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

// Do NOT clear the refresh cookie on 500 — the error may be transient (or a
// deployment misconfiguration) and clearing it would permanently log out a
// valid user.
function serverErrorResponse() {
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

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return { errName: err.name, errMessage: err.message, errStack: err.stack }
  }
  return { errRaw: String(err) }
}

// The rate store already falls back to memory when Upstash fails; this only
// guards against the store itself failing to initialise. Failing open here is
// fine: refresh still requires a valid, unrotated refresh token.
async function rateLimit(request: NextRequest): Promise<RateLimitResult> {
  try {
    return await checkRateLimit(request, 'auth:refresh', RATE_LIMIT, RATE_WINDOW_MS)
  } catch (err) {
    logger.warn('refresh_rate_limit_unavailable', serializeError(err))
    return { allowed: true, limit: RATE_LIMIT, remaining: RATE_LIMIT, retryAfterSeconds: 0 }
  }
}

// Best-effort: a missing or broken Firebase Admin setup must never fail a
// refresh. Imported lazily so firebase-admin (an external package resolved
// from node_modules at runtime) is not loaded when the route module loads.
async function getFreshGooglePhoto(uid: string): Promise<string | null> {
  try {
    const { getFreshPhotoURL } = await import('@/lib/firebase/firebase-admin')
    return await getFreshPhotoURL(uid)
  } catch (err) {
    logger.warn('refresh_photo_unavailable', serializeError(err))
    return null
  }
}

async function handleRefresh(request: NextRequest): Promise<NextResponse> {
  const rl = await rateLimit(request)
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

  // Without this check a missing JWT secret makes verifyRefreshToken reject,
  // which would be reported as token_invalid and clear every user's cookie.
  const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name])
  if (missingEnv.length > 0) {
    logger.error('refresh_misconfigured', {
      missingEnv,
      requestId: request.headers.get('x-request-id'),
    })
    return serverErrorResponse()
  }

  let decoded
  try {
    decoded = await verifyRefreshToken(refreshToken)
  } catch {
    return errorResponse('token_invalid', 200, rl)
  }

  const [{ default: mongoose }, { Session, User, connectToDatabase }, { rotateSession, wasSessionRotatedWithin }] =
    await Promise.all([
      import('mongoose'),
      import('@/lib/database/db'),
      import('@/lib/auth/sessions'),
    ])

  // Validate both IDs before any DB lookup. Both Session._id and User._id are
  // ObjectId; Mongoose throws CastError on a non-24-hex string.
  if (
    !mongoose.isValidObjectId(decoded.jti) ||
    !mongoose.isValidObjectId(decoded.id)
  ) {
    return errorResponse('token_invalid', 200, rl)
  }

  // connectToDatabase caches the connection on globalThis — safe to call per
  // request; it only opens a new connection on a cold start.
  await connectToDatabase()

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
    const freshPhoto = await getFreshGooglePhoto(user.uid)
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
    role: resolveRole(user),
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
    return serverErrorResponse()
  }
}
