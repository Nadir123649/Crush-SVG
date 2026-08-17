import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { listActiveSessions, revokeAllSessions } from '@/lib/sessions'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))

  const { docs, total } = await listActiveSessions(who.user.id, page, limit)
  return NextResponse.json(
    {
      sessions: docs.map((d) => ({
        id: d._id.toString(),
        provider: d.provider,
        browser: d.browser,
        os: d.os,
        deviceType: d.deviceType,
        ip: d.ip,
        location: d.location,
        remember: d.remember,
        createdAt: d.createdAt.toISOString(),
        lastSeenAt: d.lastSeenAt.toISOString(),
        status: d.status,
      })),
      meta: {
        total,
        page,
        per_page: limit,
        total_pages: Math.ceil(total / limit),
      },
    },
    { status: 200 }
  )
}

export async function DELETE(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  await revokeAllSessions(who.user.id, 'revoked')
  await invalidateSessionCache()

  const res = new NextResponse(null, { status: 204 })
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
