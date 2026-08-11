import { NextResponse } from 'next/server'

import { getSessionUser, toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ user: toUserDTO(user) }, { status: 200 })
}
