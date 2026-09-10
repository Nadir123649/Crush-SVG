import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { Settings, AuditLog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { getClientIp } from '@/lib/security/ip'
import { SITE_SETTINGS_CACHE_TAG } from '@/lib/data/settings'

export const runtime = 'nodejs'

type SettingsPatch = {
  siteName?: string
  supportEmail?: string
  logoUrl?: string
}

async function getOrCreateSettings() {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }
  return settings
} 

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error

  const settings = await getOrCreateSettings()
  return successResponse({ settings: settings.toObject() }, 200, undefined, request)
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  let body: SettingsPatch
  try {
    body = (await request.json()) as SettingsPatch
  } catch {
    return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
  }

  const settings = await getOrCreateSettings()

  let updated = false
  if (body.siteName !== undefined) {
    settings.siteName = body.siteName
    updated = true
  }
  if (body.supportEmail !== undefined) {
    settings.supportEmail = body.supportEmail
    updated = true
  }
  if (body.logoUrl !== undefined) {
    settings.logoUrl = body.logoUrl
    updated = true
  }

  if (updated) {
    await settings.save()
    revalidateTag(SITE_SETTINGS_CACHE_TAG, 'max')

    await AuditLog.create({
      adminId: who.user.id,
      action: 'settings_updated',
      target: 'global_settings',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      details: body,
      ipAddress: getClientIp(request),
    })
  }

  return successResponse({ settings: settings.toObject() }, 200, undefined, request)
}
