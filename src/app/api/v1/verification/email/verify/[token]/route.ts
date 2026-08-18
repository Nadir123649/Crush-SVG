import { NextRequest, NextResponse } from 'next/server'

import { User } from '@/lib/db'
import { hashToken } from '@/lib/passwords'
import { createSession } from '@/lib/sessions'
import { buildTokenPayload } from '@/lib/tokens'
import { getClientIp } from '@/lib/ip'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const wantsHtml = request.headers.get('accept')?.includes('text/html') ?? false
  const base = getOrigin(request)

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
    res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    return res
  }
  return successResponse({ message: 'Email verified. You can now log in.' })
}
