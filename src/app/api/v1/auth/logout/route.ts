import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { revokeSession } from '@/lib/sessions'
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
    if (who.user.jti) {
      await revokeSession(who.user.jti, who.user.id)
      await invalidateSessionCache(who.user.jti)
    }
  }
  return res
}
