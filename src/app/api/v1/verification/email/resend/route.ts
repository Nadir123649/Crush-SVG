import { NextRequest } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { forgotPasswordSchema } from '@/lib/auth/auth-validation'
import { User } from '@/lib/database/db'
import { generateToken, hashToken, VERIFY_TOKEN_MINUTES } from '@/lib/auth/passwords'
import { sendVerificationEmail } from '@/emails/email'
import { successResponse, errorResponse, getOrigin } from '@/lib/http/api-response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'verification:resend', 3, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const email = parsed.data.email.toLowerCase().trim()
  const user = await User.findOne({ email, password: { $exists: true } })
  if (!user || user.isVerified) {
    return successResponse({
      message: 'If the account exists and is unverified, a verification email has been sent.',
    })
  }

  const token = generateToken()
  const now = Date.now()
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationToken: hashToken(token),
        emailVerificationTokenExpire: now + VERIFY_TOKEN_MINUTES * 60 * 1000,
      },
    }
  )

  const verifyUrl = `${getOrigin(request)}/api/v1/verification/email/verify/${token}`
  try {
    await sendVerificationEmail(email, verifyUrl)
  } catch (e) {
    console.error('Verification email failed to send:', e)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Email verification for ${email}: ${verifyUrl}`)
  }

  return successResponse({
    message: 'If the account exists and is unverified, a verification email has been sent.',
  })
}
