import { NextResponse } from 'next/server'

import { generatePasswordResetLink } from '@/lib/firebase-admin'
import { resetPasswordSchema } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const link = await generatePasswordResetLink(parsed.data.email)
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: true, devLink: link }, { status: 200 })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
