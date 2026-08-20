import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/middleware/auth-middleware'
import { revokeAllSessions } from '@/lib/auth/sessions'
import { REFRESH_COOKIE_NAME } from '@/lib/auth/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  await revokeAllSessions(who.user.id, 'logged_out')
  await invalidateSessionCache()

  const res = NextResponse.json(
    { success: true, payload: { message: 'Logged out from all devices' } },
    { status: 200 }
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
