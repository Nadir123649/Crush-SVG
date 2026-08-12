import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, revokeSession } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const { id } = await params
  const sessions = await getSessionsCollection()
  const revoked = await revokeSession(
    sessions,
    id,
    new (await import('mongodb')).ObjectId(who.user.id)
  )
  if (!revoked) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  invalidateSessionCache(id)
  publishLogout(who.user.id)
  return new NextResponse(null, { status: 204 })
}
