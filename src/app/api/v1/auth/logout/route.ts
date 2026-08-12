import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, revokeSession } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  const res = NextResponse.json(
    { success: true, payload: { message: 'Logged out successfully' } },
    { status: 200 }
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)

  if ('user' in who) {
    const sessions = await getSessionsCollection()
    if (who.user.jti) {
      await revokeSession(sessions, who.user.jti, new (await import('mongodb')).ObjectId(who.user.id))
      invalidateSessionCache(who.user.jti)
      publishLogout(who.user.id)
    }
  }
  return res
}
