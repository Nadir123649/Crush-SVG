import { NextRequest, NextResponse } from 'next/server'

import { verifyIdToken } from '@/lib/firebase-admin'
import { providerIdToName, resolveUserCascade } from '@/lib/firebase-user'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { createSession } from '@/lib/sessions'
import { buildTokenPayload } from '@/lib/tokens'
import { oauthSchema } from '@/lib/validation'
import { REFRESH_COOKIE_NAME, toUserDTO } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const PROVIDER_URL_MAP: Record<string, string> = {
  google: 'google.com',
  github: 'github.com',
  x: 'twitter.com',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const slug = (await params).slug
  const rawProvider = slug?.[0]
  const provider = rawProvider && PROVIDER_URL_MAP[rawProvider] ? rawProvider : undefined

  if (!provider) {
    return errorResponse(404, 'unknown_provider', 'Unknown provider', undefined, request)
  }

  const rl = await checkRateLimit(request, `oauth:${provider}`, 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(
      429,
      'rate_limit_exceeded',
      'Too many requests. Try again later.',
      rateLimitHeaders(rl),
      request
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body', undefined, request)
  }

  const parsed = oauthSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      400,
      'validation_error',
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input',
      undefined,
      request
    )
  }

  try {
    const token = await verifyIdToken(parsed.data.firebaseToken)
    const expectedProviderId = PROVIDER_URL_MAP[provider]
    if (token.firebase?.sign_in_provider !== expectedProviderId) {
      return errorResponse(400, 'provider_mismatch', 'Provider mismatch', undefined, request)
    }

    // Password gate: email must be verified for password provider
    if (provider === 'password' && token.email_verified !== true) {
      return errorResponse(
        403,
        'email_not_verified',
        'Email not verified. Please verify your email before logging in.',
        undefined,
        request
      )
    }

    const providerName = providerIdToName(token.firebase?.sign_in_provider ?? provider)
    const user = await resolveUserCascade(token, providerName)

    const session = await createSession({
      userId: user._id,
      provider: providerName,
      remember: parsed.data.rememberMe ?? true,
      ip: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      browser: undefined,
      os: undefined,
      deviceType: undefined,
    })

    const tokenPair = buildTokenPayload({
      id: user._id.toString(),
      role: 'free',
      sessionId: session._id.toString(),
      tokenVersion: session.tokenVersion,
    })

    const remember = parsed.data.rememberMe ?? true
    const res = successResponse(
      {
        user: toUserDTO(user),
        token: tokenPair,
        sessionId: session._id.toString(),
      },
      200,
      rateLimitHeaders(rl),
      request
    )
    res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 7 * 24 * 60 * 60 : undefined,
    })
    return res
  } catch (error) {
    logger.error('oauth_failed', { provider, requestId: request.headers.get('x-request-id'), error: error instanceof Error ? error.message : String(error) })
    return errorResponse(401, 'invalid_token', 'Invalid or expired token', undefined, request)
  }
}