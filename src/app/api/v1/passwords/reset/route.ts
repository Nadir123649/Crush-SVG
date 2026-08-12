import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/auth-validation'
import { getUsersCollection } from '@/lib/db'
import { hashPassword, hashToken, verifyPassword } from '@/lib/passwords'
import { getSessionsCollection, revokeAllSessions } from '@/lib/sessions'
import { invalidateSessionCache } from '@/lib/auth-middleware'
import { publishLogout } from '@/lib/session-broker'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return errorResponse(400, 'validation_error', 'Token is required')

  const users = await getUsersCollection()
  const user = await users.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordTokenExpire: { $gt: Date.now() },
  })
  return successResponse({ valid: !!user })
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('passwords:reset', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many password reset attempts. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const token = (body as { token?: unknown })?.token
  if (typeof token !== 'string' || !token) {
    return errorResponse(400, 'validation_error', 'Token is required')
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const hashedToken = hashToken(token)
  const users = await getUsersCollection()
  const user = await users.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  })
  if (!user) return errorResponse(400, 'token_invalid', 'Invalid or expired reset token')

  if (user.password && (await verifyPassword(parsed.data.password, user.password))) {
    return errorResponse(
      400,
      'same_password',
      'You are already using this password. Please choose a different password.'
    )
  }

  const hashedPassword = await hashPassword(parsed.data.password)
  const consumed = await users.updateOne(
    {
      _id: user._id,
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpire: { $gt: Date.now() },
    },
    {
      $set: { password: hashedPassword, isVerified: true, updatedAt: new Date() },
      $unset: { resetPasswordToken: '', resetPasswordTokenExpire: '' },
    }
  )
  if (consumed.modifiedCount === 0) {
    return errorResponse(400, 'token_invalid', 'Invalid or expired reset token')
  }

  const sessions = await getSessionsCollection()
  await revokeAllSessions(sessions, user._id, 'revoked')
  invalidateSessionCache()
  publishLogout(user._id.toString())

  return successResponse({ message: 'Password changed. Please log in with your new password.' })
}
