import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { AuditLog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { getClientIp } from '@/lib/security/ip'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { SITE_SETTINGS_CACHE_TAG } from '@/lib/data/settings'

export const runtime = 'nodejs'

/**
 * POST /api/v1/admin/cache/purge
 *
 * Invalidates all server-side Next.js cache tags used by the admin panel.
 * Requires admin authentication. Rate-limited to 5 calls per minute.
 */
export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:cache:purge', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  // Revalidate all known cache tags used by the application
  revalidateTag(SITE_SETTINGS_CACHE_TAG, 'max')

  await AuditLog.create({
    adminId: who.user.id,
    action: 'cache_purged',
    target: 'global_cache',
    resourceType: 'system',
    resourceId: 'global',
    details: { tags: [SITE_SETTINGS_CACHE_TAG] },
    ipAddress: getClientIp(request),
  })

  return successResponse({ purged: true, tags: [SITE_SETTINGS_CACHE_TAG] }, 200, undefined, request)
}
