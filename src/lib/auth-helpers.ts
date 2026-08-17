import 'server-only'

import { NextRequest } from 'next/server'

import type { UserDoc } from '@/lib/db'
import { createSession } from '@/lib/sessions'
import { buildTokenPayload } from '@/lib/tokens'
import { toUserDTO } from '@/lib/auth'

export function authPayload(user: UserDoc, sessionId?: string, tokenVersion?: number) {
  const payload: Record<string, unknown> = {
    user: toUserDTO(user),
    token: buildTokenPayload({
      id: user._id.toString(),
      role: 'free',
      sessionId,
      tokenVersion,
    }),
  }
  if (sessionId) payload.sessionId = sessionId
  return payload
}

export async function issueSession(
  request: NextRequest,
  user: UserDoc,
  provider: string,
  remember = true
): Promise<{ sessionId: string; payload: Record<string, unknown> }> {
  const session = await createSession({
    userId: user._id,
    provider,
    remember,
    ip: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })
  const sessionId = session._id.toString()
  return { sessionId, payload: authPayload(user, sessionId, session.tokenVersion) }
}
