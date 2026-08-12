import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
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
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const sessions = await getSessionsCollection()
  const revoked = await revokeSession(
    sessions,
    id,
    new ObjectId(who.user.id)
  )
  if (!revoked) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  invalidateSessionCache(id)
  publishLogout(who.user.id)

  const res = new NextResponse(null, { status: 204 })
  if (who.user.jti === id) {
    res.cookies.delete(REFRESH_COOKIE_NAME)
  }
  return res
}
