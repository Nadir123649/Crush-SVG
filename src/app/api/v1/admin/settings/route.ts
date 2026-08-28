import { NextRequest } from 'next/server'
import { auth } from '@/lib/middleware/auth-middleware'
import { Settings, AuditLog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { getClientIp } from '@/lib/security/ip'

export const runtime = 'nodejs'

async function getOrCreateSettings() {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }
  return settings
} 

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error
  if (who.user.role !== 'admin') {
    return errorResponse(403, 'forbidden', 'Admin access required', undefined, request)
  }

  const settings = await getOrCreateSettings()
  return successResponse({ settings: settings.toObject() }, 200, undefined, request)
}

export async function PATCH(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error
  if (who.user.role !== 'admin') {
    return errorResponse(403, 'forbidden', 'Admin access required', undefined, request)
  }

  let body: any
  try {
    body = await request.json()
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
