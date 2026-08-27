import { NextRequest } from 'next/server'
import { auth } from '@/lib/middleware/auth-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { User, AuditLog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const rl = await checkRateLimit(request, 'admin:users:delete', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const who = await auth(request)
  if ('error' in who) return who.error
  if (who.user.role !== 'admin') {
    return errorResponse(403, 'forbidden', 'Admin access required', undefined, request)
  }

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
    metadata: { email: user.email, role: user.role },
  })

  return successResponse({ deleted: true, uid }, 200, rateLimitHeaders(rl), request)
}
