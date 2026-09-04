import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { User, AuditLog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { getClientIp } from '@/lib/security/ip'
import { toUserDTO } from '@/lib/auth/auth'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const rl = await checkRateLimit(request, 'admin:users:delete', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  const { uid } = await params

  if (!uid) {
    return errorResponse(400, 'bad_request', 'Missing uid parameter', undefined, request)
  }

  const user = await User.findOne({ uid })
  if (!user) {
    return errorResponse(404, 'not_found', 'User not found', undefined, request)
  }

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' })
    if (adminCount <= 1) {
      return errorResponse(400, 'bad_request', 'Cannot delete the last admin user', undefined, request)
    }
  }

  await User.deleteOne({ uid })

  await AuditLog.create({
    adminId: who.user.id,
    action: 'user_deleted',
    target: uid,
    resourceType: 'user',
    resourceId: uid,
    details: { email: user.email, role: user.role },
    ipAddress: getClientIp(request),
    metadata: { email: user.email, role: user.role },
  })

  return successResponse({ deleted: true, uid }, 200, rateLimitHeaders(rl), request)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const rl = await checkRateLimit(request, 'admin:users:update', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  const { uid } = await params
  if (!uid) {
    return errorResponse(400, 'bad_request', 'Missing uid parameter', undefined, request)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
  }

  const { displayName, role } = body
  if (role && role !== 'admin' && role !== 'user') {
    return errorResponse(400, 'invalid_role', 'Role must be user or admin', undefined, request)
  }

  const user = await User.findOne({ uid })
  if (!user) {
    return errorResponse(404, 'not_found', 'User not found', undefined, request)
  }

  // Prevent granting Admin role to unverified users
  const isVerified = user.isVerified === true || (Array.isArray(user.providers) && user.providers.some((p: string) => p === 'google' || p === 'google.com'))
  if (role === 'admin' && !isVerified) {
    return errorResponse(400, 'unverified_user', 'User is unverified', undefined, request)
  }

  if (role === 'user' && user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' })
    if (adminCount <= 1) {
      return errorResponse(400, 'bad_request', 'Cannot demote the last admin user', undefined, request)
    }
  }

  if (displayName !== undefined) {
    if (typeof displayName !== 'string' || displayName.trim().length === 0) {
      return errorResponse(400, 'invalid_name', 'Display name cannot be empty', undefined, request)
    }
    const trimmed = displayName.trim()
    if (trimmed.length < 3 || trimmed.length > 16) {
      return errorResponse(400, 'invalid_name', 'Display name must be between 3 and 16 characters', undefined, request)
    }
    user.displayName = trimmed
  }
  if (role) user.role = role

  await user.save()

  await AuditLog.create({
    adminId: who.user.id,
    action: 'user_updated',
    target: uid,
    resourceType: 'user',
    resourceId: uid,
    details: { email: user.email, newRole: role, newDisplayName: user.displayName },
    ipAddress: getClientIp(request),
    metadata: { email: user.email },
  })

  return successResponse({ updated: true, user: toUserDTO(user) }, 200, rateLimitHeaders(rl), request)
}
