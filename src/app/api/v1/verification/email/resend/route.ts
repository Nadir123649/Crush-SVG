import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/auth-validation'
import { getUsersCollection } from '@/lib/db'
import { generateToken, hashToken, VERIFY_TOKEN_MINUTES } from '@/lib/passwords'
import { sendVerificationEmail } from '@/lib/email'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('verification:resend', 3, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const email = parsed.data.email.toLowerCase().trim()
  const users = await getUsersCollection()
  const user = await users.findOne({ email })
  if (!user || user.isVerified) {
    return successResponse({
      message: 'If the account exists and is unverified, a verification email has been sent.',
    })
  }

  const token = generateToken()
  const now = Date.now()
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationToken: hashToken(token),
        emailVerificationTokenExpire: now + VERIFY_TOKEN_MINUTES * 60 * 1000,
        updatedAt: new Date(now),
      },
    }
  )

  const verifyUrl = `${getOrigin(request)}/api/v1/verification/email/verify/${token}`
  void sendVerificationEmail(email, verifyUrl).catch((e) => {
    console.error('Verification email failed to send:', e)
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Email verification for ${email}: ${verifyUrl}`)
  }

  return successResponse({
    message: 'If the account exists and is unverified, a verification email has been sent.',
  })
}
