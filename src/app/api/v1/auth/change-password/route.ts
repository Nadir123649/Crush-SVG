import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'

import { checkRateLimit } from '@/lib/rate-limit'
import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { changePasswordSchema } from '@/lib/auth-validation'
import { getUsersCollection } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/passwords'
import { getSessionsCollection, revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { successResponse, errorResponse } from '@/lib/api-response'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:change-password', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const users = await getUsersCollection()
  const user = await users.findOne({ _id: new ObjectId(who.user.id) })
  if (!user) return errorResponse(404, 'user_not_found', 'User not found')
  if (!user.password) {
    return errorResponse(400, 'no_password', 'No password set. Use OAuth or forgot password instead.')
  }

  const isMatch = await verifyPassword(parsed.data.currentPassword, user.password)
  if (!isMatch) return errorResponse(401, 'invalid_credentials', 'Current password is incorrect')

  const isSamePassword = await verifyPassword(parsed.data.newPassword, user.password)
  if (isSamePassword) {
    return errorResponse(
      400,
      'same_password',
      'You are already using this password. Please choose a different password.'
    )
  }

  const newHash = await hashPassword(parsed.data.newPassword)
  await users.updateOne(
    { _id: user._id },
    {
      $set: { password: newHash, updatedAt: new Date() },
      $unset: { resetPasswordToken: '', resetPasswordTokenExpire: '' },
    }
  )

  const sessions = await getSessionsCollection()
  await revokeAllSessions(sessions, user._id, 'revoked')
  invalidateSessionCache()
  publishLogout(user._id.toString())

  const res = successResponse(
    { message: 'Password changed successfully. Please sign in again.' },
    200
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
