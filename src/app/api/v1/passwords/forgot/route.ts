import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/auth-validation'
import { getUsersCollection } from '@/lib/db'
import { generateToken, hashToken, RESET_TOKEN_MINUTES } from '@/lib/passwords'
import { sendResetPasswordEmail } from '@/lib/email'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'

export const runtime = 'nodejs'

const GENERIC_MESSAGE = 'If an account with that email exists, a reset link has been sent.'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('passwords:forgot', 3, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many password reset requests. Try again later.')
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
  if (!user) return successResponse({ message: GENERIC_MESSAGE })

  const token = generateToken()
  const now = Date.now()
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: hashToken(token),
        resetPasswordTokenExpire: now + RESET_TOKEN_MINUTES * 60 * 1000,
        updatedAt: new Date(now),
      },
    }
  )

  const resetUrl = `${getOrigin(request)}/reset-password/${token}`
  void sendResetPasswordEmail(email, resetUrl, RESET_TOKEN_MINUTES).catch((e) => {
    console.error('Reset password email failed to send:', e)
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Password reset link for ${email}: ${resetUrl}`)
  }

  return successResponse({ message: GENERIC_MESSAGE })
}
