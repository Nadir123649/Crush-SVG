import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const sessions = await getSessionsCollection()
  await revokeAllSessions(
    sessions,
    new (await import('mongodb')).ObjectId(who.user.id),
    'logged_out'
  )
  invalidateSessionCache()
  publishLogout(who.user.id)

  const res = NextResponse.json(
    { success: true, payload: { message: 'Logged out from all devices' } },
    { status: 200 }
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
