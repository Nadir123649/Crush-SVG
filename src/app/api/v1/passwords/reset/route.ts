import { NextRequest } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/auth-validation'
import { User } from '@/lib/db'
import { hashPassword, hashToken, verifyPassword } from '@/lib/passwords'
import { revokeAllSessions } from '@/lib/sessions'
import { invalidateSessionCache } from '@/lib/auth-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return errorResponse(400, '', '', undefined, request)

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordTokenExpire: { $gt: Date.now() },
  })
  return successResponse({ valid: !!user })
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'passwords:reset', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const token = (body as { token?: unknown })?.token
  if (typeof token !== 'string' || !token) {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const hashedToken = hashToken(token)
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  })
  if (!user) return errorResponse(400, '', '', undefined, request)

  if (user.password && (await verifyPassword(parsed.data.password, user.password))) {
    return errorResponse(
      400,
      'same_password',
      'You are already using this password. Please choose a different password.'
    )
  }

  const hashedPassword = await hashPassword(parsed.data.password)
  const consumed = await User.updateOne(
    {
      _id: user._id,
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpire: { $gt: Date.now() },
    },
    {
      $set: { password: hashedPassword, isVerified: true },
      $unset: { resetPasswordToken: '', resetPasswordTokenExpire: '' },
    }
  )
  if (consumed.modifiedCount === 0) {
    return errorResponse(400, '', '', undefined, request)
  }

  await revokeAllSessions(user._id, 'revoked')
  await invalidateSessionCache()

  return successResponse({ message: 'Password changed. Please log in with your new password.' })
}
