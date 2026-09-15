import { NextRequest, NextResponse } from 'next/server'

import { User } from '@/lib/database/db'
import { hashToken } from '@/lib/auth/passwords'
import { createSession } from '@/lib/auth/sessions'
import { buildTokenPayload } from '@/lib/auth/tokens'
import { getClientIp } from '@/lib/security/ip'
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '@/lib/auth/auth'
import { successResponse, errorResponse, getFrontendOrigin } from '@/lib/http/api-response'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const wantsHtml = request.headers.get('accept')?.includes('text/html') ?? false
  const base = getFrontendOrigin(request)

  const user = await User.findOne({
    emailVerificationToken: hashToken(token),
    emailVerificationTokenExpire: { $gt: Date.now() },
  })
  if (!user) {
    if (wantsHtml) {
      return NextResponse.redirect(new URL('/verify?status=invalid', base))
    }
    return errorResponse(400, 'token_invalid', 'Invalid or expired verification link')
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { isVerified: true },
      $unset: { emailVerificationToken: '', emailVerificationTokenExpire: '' },
    }
  )

  if (wantsHtml) {
    // Verifying the email proves ownership of the inbox — sign the user in
    // immediately so "Go To CrushSVG" lands them on the app as logged in.
    const session = await createSession({
      userId: user._id,
      provider: 'email',
      remember: true,
      ip: getClientIp(request) ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    const tokenPair = buildTokenPayload({
      id: user._id.toString(),
      role: user.role ?? 'user',
      sessionId: session._id.toString(),
    })

    const res = NextResponse.redirect(new URL('/verify?status=success', base))
    res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, getRefreshCookieOptions(true))
    return res
  }
  return successResponse({ message: 'Email verified. You can now log in.' })
}
