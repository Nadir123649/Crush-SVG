import { NextRequest } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { forgotPasswordSchema } from '@/lib/auth/auth-validation'
import { User } from '@/lib/database/db'
import { generateToken, hashToken, RESET_TOKEN_MINUTES } from '@/lib/auth/passwords'
import { isEmailDeliveryConfigured, resolveTransport, sendResetPasswordEmail } from '@/lib/integrations/email'
import { successResponse, errorResponse, getFrontendOrigin } from '@/lib/http/api-response'
import { getRequestId } from '@/lib/shared/logger'

export const runtime = 'nodejs'

const GENERIC_MESSAGE = 'If an account with that email exists, a reset link has been sent.'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'passwords:forgot', 3, 60_000)
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

  // Check provider configuration before account lookup so this response does
  // not reveal whether the submitted address belongs to an account.
  if (!isEmailDeliveryConfigured()) {
    return errorResponse(
      503,
      'email_unavailable',
      'Password reset email is temporarily unavailable. Please try again later.',
      undefined,
      request,
    )
  }

  const email = parsed.data.email.toLowerCase().trim()
  // Any account with this email — including social-only accounts (Google etc.)
  // that never set a password. For them the reset link acts as "set a
  // password": the reset route stores the new password without requiring an
  // existing one, which lets them log in with email+password afterwards.
  const user = await User.findOne({ email })
  if (!user) return successResponse({ message: GENERIC_MESSAGE })

  const token = generateToken()
  const now = Date.now()
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: hashToken(token),
        resetPasswordTokenExpire: now + RESET_TOKEN_MINUTES * 60 * 1000,
      },
    }
  )

  const resetUrl = `${getFrontendOrigin(request)}/reset-password/${token}`
  try {
    await sendResetPasswordEmail(email, resetUrl, getFrontendOrigin(request))
  } catch (e) {
    const error = e as { code?: unknown; statusCode?: unknown }
    console.error('Password reset email delivery failed', {
      requestId: getRequestId(request),
      transport: resolveTransport(),
      code: typeof error?.code === 'string' ? error.code : 'unknown',
      statusCode: typeof error?.statusCode === 'number' ? error.statusCode : undefined,
    })
  }
  return successResponse({ message: GENERIC_MESSAGE })
}
