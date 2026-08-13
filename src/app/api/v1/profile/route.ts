import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { updateProfileSchema } from '@/lib/validation'
import { User } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'profile:get', 60, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  const user = await User.findById(who.user.id)

  if (!user) {
    return errorResponse(404, '', '', undefined, request)
  }

  return successResponse({ user: toUserDTO(user) })
}

export async function PATCH(request: NextRequest) {
  const rl = await checkRateLimit(request, 'profile:update', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { displayName, name } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (displayName !== undefined) updateData.displayName = displayName
  if (name !== undefined) updateData.name = name

  const updated = await User.findByIdAndUpdate(
    who.user.id,
    { $set: updateData },
    { new: true }
  )

  if (!updated) {
    return errorResponse(404, '', '', undefined, request)
  }

  return successResponse({ user: toUserDTO(updated) })
}

export async function DELETE(request: NextRequest) {
  const rl = await checkRateLimit(request, 'profile:delete', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const { password } = body as { password?: string }
  if (!password) {
    return errorResponse(400, '', '', undefined, request)
  }

  const user = await User.findById(who.user.id)

  if (!user || !user.password) {
    return errorResponse(400, '', '', undefined, request)
  }

  const { verifyPassword } = await import('@/lib/passwords')
  const isMatch = await verifyPassword(password, user.password)
  if (!isMatch) {
    return errorResponse(401, '', '', undefined, request)
  }

  await User.deleteOne({ _id: user._id })

  const { revokeAllSessions } = await import('@/lib/sessions')
  const { invalidateSessionCache } = await import('@/lib/auth-middleware')

  await revokeAllSessions(user._id, 'revoked')
  await invalidateSessionCache()

  const res = successResponse({ message: 'Account deleted successfully' })
  const { REFRESH_COOKIE_NAME } = await import('@/lib/auth')
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
