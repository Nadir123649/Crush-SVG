import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'

import { checkRateLimit } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/auth-validation'
import { getUsersCollection } from '@/lib/db'
import { hashPassword, generateToken, hashToken, VERIFY_TOKEN_MINUTES } from '@/lib/passwords'
import { sendVerificationEmail } from '@/lib/email'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:register', 3, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many registration attempts. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message = Object.values(first).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', message)
  }

  const email = parsed.data.email.toLowerCase().trim()
  const users = await getUsersCollection()

  const existingUser = await users.findOne({ email })
  if (existingUser) {
    return errorResponse(
      409,
      'account_already_exists',
      'An account with this email already exists. Please log in instead.'
    )
  }

  const password = await hashPassword(parsed.data.password)
  const token = generateToken()
  const now = Date.now()

  await users.insertOne({
    _id: new ObjectId(),
    uid: `email_${email}`,
    email,
    displayName: parsed.data.name,
    name: parsed.data.name,
    photoURL: null,
    providers: ['email'],
    linkedProviders: ['email'],
    password,
    isVerified: false,
    emailVerificationToken: hashToken(token),
    emailVerificationTokenExpire: now + VERIFY_TOKEN_MINUTES * 60 * 1000,
    conversionsUsed: 0,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    lastLoginAt: new Date(now),
  })

  const verifyUrl = `${getOrigin(request)}/api/v1/verification/email/verify/${token}`
  void sendVerificationEmail(email, verifyUrl).catch((e) => {
    console.error('Verification email failed to send:', e)
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Email verification for ${email}: ${verifyUrl}`)
  }

  return successResponse(
    { message: 'Registration successful. Please check your email to verify your account.' },
    201
  )
}
