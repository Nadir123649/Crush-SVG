import { NextRequest, NextResponse } from 'next/server'

import { isValidObjectId } from 'mongoose'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { revokeSession } from '@/lib/sessions'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const { id } = await params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const revoked = await revokeSession(id, who.user.id)
  if (!revoked) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  await invalidateSessionCache(id)

  const res = new NextResponse(null, { status: 204 })
  if (who.user.jti === id) {
    res.cookies.delete(REFRESH_COOKIE_NAME)
  }
  return res
}
