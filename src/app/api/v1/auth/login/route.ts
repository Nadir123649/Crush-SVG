import { NextRequest } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/auth-validation'
import { User } from '@/lib/db'
import { verifyPassword } from '@/lib/passwords'
import { checkBruteForce, recordFailure, resetBruteForce } from '@/lib/brute-force'
import { issueSession } from '@/lib/auth-helpers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'auth:login', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const email = parsed.data.email.toLowerCase().trim()
  const rememberMe = (body as { rememberMe?: unknown })?.rememberMe === true

  const bf = await checkBruteForce(request, `login:${email}`)
  if (bf.blocked) {
    return errorResponse(429, 'account_locked', 'Too many failed login attempts. Please wait before trying again.', { 'Retry-After': String(Math.ceil(bf.retryAfter / 1000)) })
  }

  const user = await User.findOne({ email, password: { $exists: true } })
  if (!user) {
    // The email belongs to a social-only account (Google/GitHub etc., no
    // password set) — "incorrect password" would send the user in circles.
    const socialAccount = await User.findOne({ email, password: { $exists: false } })
    if (socialAccount) {
      await recordFailure(request, `login:${email}`)
      return errorResponse(
        401,
        'social_login_required',
        'This email is linked to a social login (e.g. Google). Sign in with that option, or set a password using the "Forgot password?" link.',
        undefined,
        request
      )
    }
    await recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Email or password is incorrect.', undefined, request)
  }
  if (!user.password) {
    await recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Email or password is incorrect.', undefined, request)
  }
  const isMatch = await verifyPassword(parsed.data.password, user.password)
  if (!isMatch) {
    await recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Email or password is incorrect.', undefined, request)
  }
  if (!user.isVerified) {
    return errorResponse(
      401,
      'email_not_verified',
      'Your email is not verified yet. Please verify your email first, then log in — check your inbox for the verification link.'
    )
  }

  await resetBruteForce(request, `login:${email}`)
  const now = new Date()
  await User.updateOne(
    { _id: user._id },
    {
      $set: { lastLoginAt: now },
      $addToSet: { linkedProviders: 'email' },
    }
  )
  user.lastLoginAt = now
  user.linkedProviders = [...(user.linkedProviders ?? []), 'email']

  const { payload } = await issueSession(request, user, 'email', rememberMe)
  const res = successResponse({ ...payload, remember: rememberMe }, 200)
  res.cookies.set(REFRESH_COOKIE_NAME, (payload.token as { refreshToken: string }).refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
  })
  return res
}
