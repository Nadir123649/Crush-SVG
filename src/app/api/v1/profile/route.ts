import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { updateProfileSchema } from '@/lib/validation'
import { getUsersCollection } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { toUserDTO } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('profile:get', 60, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  const users = await getUsersCollection()
  const user = await users.findOne({ _id: new ObjectId(who.user.id) })

  if (!user) {
    return errorResponse(404, 'user_not_found', 'User not found')
  }

  return successResponse({ user: toUserDTO(user) })
}

export async function PATCH(request: NextRequest) {
  const rl = checkRateLimit('profile:update', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { displayName, name } = parsed.data
  const updateData: Record<string, unknown> = { updatedAt: new Date() }

  if (displayName !== undefined) updateData.displayName = displayName
  if (name !== undefined) updateData.name = name

  const users = await getUsersCollection()
  const updated = await users.findOneAndUpdate(
    { _id: new ObjectId(who.user.id) },
    { $set: updateData },
    { returnDocument: 'after' }
  )

  if (!updated) {
    return errorResponse(404, 'user_not_found', 'User not found')
  }

  return successResponse({ user: toUserDTO(updated) })
}

export async function DELETE(request: NextRequest) {
  const rl = checkRateLimit('profile:delete', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const { password } = body as { password?: string }
  if (!password) {
    return errorResponse(400, 'validation_error', 'Password is required to delete account')
  }

  const users = await getUsersCollection()
  const user = await users.findOne({ _id: new ObjectId(who.user.id) })

  if (!user || !user.password) {
    return errorResponse(400, 'invalid_operation', 'Cannot delete OAuth-only account via this endpoint')
  }

  const { verifyPassword } = await import('@/lib/passwords')
  const isMatch = await verifyPassword(password, user.password)
  if (!isMatch) {
    return errorResponse(401, 'invalid_credentials', 'Password is incorrect')
  }

  await users.deleteOne({ _id: user._id })

  const { getSessionsCollection, revokeAllSessions } = await import('@/lib/sessions')
  const { invalidateSessionCache } = await import('@/lib/auth-middleware')
  const { publishLogout } = await import('@/lib/session-broker')

  const sessions = await getSessionsCollection()
  await revokeAllSessions(sessions, user._id, 'revoked')
  invalidateSessionCache()
  publishLogout(user._id.toString())

  const res = successResponse({ message: 'Account deleted successfully' })
  const { REFRESH_COOKIE_NAME } = await import('@/lib/auth')
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}