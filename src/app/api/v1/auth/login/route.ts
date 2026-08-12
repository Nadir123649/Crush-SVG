import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/auth-validation'
import { getUsersCollection } from '@/lib/db'
import { verifyPassword } from '@/lib/passwords'
import { checkBruteForce, recordFailure, resetBruteForce } from '@/lib/brute-force'
import { issueSession } from '@/lib/auth-helpers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:login', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many login attempts. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const email = parsed.data.email.toLowerCase().trim()
  const rememberMe = (body as { rememberMe?: unknown })?.rememberMe === true

  const bf = checkBruteForce(request, `login:${email}`)
  if (bf.blocked) {
    return errorResponse(429, 'account_locked', 'Too many failed login attempts. Please wait before trying again.')
  }

  const users = await getUsersCollection()
  const user = await users.findOne({ email })
  if (!user) {
    recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Invalid email or password')
  }
  if (!user.password) {
    recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Invalid email or password')
  }
  const isMatch = await verifyPassword(parsed.data.password, user.password)
  if (!isMatch) {
    recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Invalid email or password')
  }
  if (!user.isVerified) {
    return errorResponse(
      401,
      'email_not_verified',
      'Please verify your email before logging in. Check your inbox for the verification link.'
    )
  }

  resetBruteForce(request, `login:${email}`)
  const now = new Date()
  await users.updateOne(
    { _id: user._id },
    {
      $set: { lastLoginAt: now, updatedAt: now },
      $addToSet: { linkedProviders: 'email' },
    }
  )
  user.lastLoginAt = now
  user.linkedProviders = [...(user.linkedProviders ?? []), 'email']

  const { payload } = await issueSession(request, user, 'email', rememberMe)
  const res = successResponse({ ...payload }, 200)
  res.cookies.set(REFRESH_COOKIE_NAME, (payload.token as { refreshToken: string }).refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
  })
  return res
}
