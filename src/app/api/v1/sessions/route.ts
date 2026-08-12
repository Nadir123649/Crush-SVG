import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, listActiveSessions, revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const sessions = await getSessionsCollection()
  const docs = await listActiveSessions(
    sessions,
    new (await import('mongodb')).ObjectId(who.user.id)
  )
  return NextResponse.json(
    {
      sessions: docs.map((d) => ({
        id: d._id.toString(),
        provider: d.provider,
        browser: d.browser,
        os: d.os,
        deviceType: d.deviceType,
        ip: d.ip,
        remember: d.remember,
        createdAt: d.createdAt.toISOString(),
        lastSeenAt: d.lastSeenAt.toISOString(),
        status: d.status,
      })),
    },
    { status: 200 }
  )
}

export async function DELETE(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const sessions = await getSessionsCollection()
  await revokeAllSessions(
    sessions,
    new (await import('mongodb')).ObjectId(who.user.id),
    'revoked'
  )
  invalidateSessionCache()
  publishLogout(who.user.id)
  return new NextResponse(null, { status: 204 })
}
