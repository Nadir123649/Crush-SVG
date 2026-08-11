import { NextResponse } from 'next/server'

import { createSessionCookie, verifyIdToken } from '@/lib/firebase-admin'
import { clearSessionCookie, setSessionCookie, toUserDTO, upsertUser } from '@/lib/auth'
import { sessionSchema } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = sessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const token = await verifyIdToken(parsed.data.idToken)
    const user = await upsertUser(token)
    const sessionCookie = await createSessionCookie(parsed.data.idToken)
    await setSessionCookie(sessionCookie)
    return NextResponse.json({ user: toUserDTO(user) }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export async function DELETE() {
  await clearSessionCookie()
  return new NextResponse(null, { status: 204 })
}
