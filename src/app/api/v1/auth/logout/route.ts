import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/middleware/auth-middleware'
import { revokeSession } from '@/lib/auth/sessions'
import { REFRESH_COOKIE_NAME, clearRefreshCookie } from '@/lib/auth/auth'
import { verifyRefreshToken } from '@/lib/auth/tokens'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  const res = NextResponse.json(
    { success: true, payload: { message: 'Logged out successfully' } },
    { status: 200 }
  )
  clearRefreshCookie(res)

  if ('user' in who && who.user.jti) {
    await revokeSession(who.user.jti, who.user.id).catch(() => {})
    await invalidateSessionCache(who.user.jti).catch(() => {})
  } else {
    // If Bearer token was missing or expired, check the refresh cookie to revoke the active session
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
    if (refreshToken) {
      try {
        const decoded = await verifyRefreshToken(refreshToken)
        if (decoded?.jti && decoded?.id) {
          await revokeSession(decoded.jti, decoded.id).catch(() => {})
          await invalidateSessionCache(decoded.jti).catch(() => {})
        }
      } catch {
        // Invalid or expired refresh token — cookie cleared regardless
      }
    }
  }

  return res
}
