import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { User } from '@/lib/db'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const user = await User.findById(who.user.id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json({ user: toUserDTO(user) }, { status: 200 })
}
