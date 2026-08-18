import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/auth-validation'
import { User, isDuplicateKeyError } from '@/lib/db'
import { hashPassword, generateToken, hashToken, VERIFY_TOKEN_MINUTES } from '@/lib/passwords'
import { sendVerificationEmail } from '@/lib/email'
import { isAdminEmail } from '@/lib/roles'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'auth:register', 3, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message = Object.values(first).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', message)
  }

  const email = parsed.data.email.toLowerCase().trim()

  // Email+password accounts are unique per email. An OAuth account that shares
  // the same email (e.g. Google) is a separate account and does NOT block signup.
  const existingPasswordAccount = await User.findOne({ email, password: { $exists: true } })
  if (existingPasswordAccount) {
    return errorResponse(
      409,
      'account_already_exists',
      'An account with this email already exists. Please log in instead.'
    )
  }

  const password = await hashPassword(parsed.data.password)
  const token = generateToken()
  const now = Date.now()

  try {
    await User.create({
      uid: `email_${randomUUID()}`,
      email,
      displayName: parsed.data.name,
      name: parsed.data.name,
      photoURL: null,
      providers: ['email'],
      linkedProviders: ['email'],
      role: isAdminEmail(email) ? 'admin' : 'user',
      password,
      isVerified: false,
      emailVerificationToken: hashToken(token),
      emailVerificationTokenExpire: now + VERIFY_TOKEN_MINUTES * 60 * 1000,
      conversionsUsed: 0,
      lastLoginAt: new Date(now),
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorResponse(
        409,
        'account_already_exists',
        'An account with this email already exists. Please log in instead.'
      )
    }
    throw error
  }

  const verifyUrl = `${getOrigin(request)}/api/v1/verification/email/verify/${token}`
  try {
    await sendVerificationEmail(email, verifyUrl)
  } catch (e) {
    console.error('Verification email failed to send:', e)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Email verification for ${email}: ${verifyUrl}`)
  }

  return successResponse(
    { message: 'Registration successful. Please check your email to verify your account.' }, 201, rateLimitHeaders(rl), request)
}
