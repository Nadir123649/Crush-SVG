import 'server-only'

import { ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

import { getSessionsCollection } from '@/lib/sessions'
import { verifyAccessToken, type DecodedAccessToken } from '@/lib/tokens'

export interface AuthUser {
  id: string
  role: string
  jti?: string
}

const SESSION_CACHE_TTL_MS = 30_000

const sessionCache = new Map<string, { valid: boolean; expiresAt: number }>()

function allowedOrigins(): string[] {
  const origins = [process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000']
  return origins.filter((o): o is string => !!o)
}

export function isMethodExempt(request: NextRequest): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(request.method)
}

export function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin') ?? request.headers.get('referer')
  if (!origin) return false
  return allowedOrigins().some((o) => origin.startsWith(o))
}

export function invalidateSessionCache(jti?: string): void {
  if (jti) {
    sessionCache.delete(jti)
  } else {
    sessionCache.clear()
  }
}

export async function auth(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: Response }> {
  if (!isMethodExempt(request) && !isAllowedOrigin(request)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden origin' },
        { status: 403 }
      ),
    }
  }

  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let decoded: DecodedAccessToken
  try {
    decoded = await verifyAccessToken(header.slice('Bearer '.length))
  } catch {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (decoded.jti) {
    const now = Date.now()
    const cached = sessionCache.get(decoded.jti)
    if (cached && cached.expiresAt > now) {
      if (!cached.valid) {
        return {
          error: NextResponse.json({ error: 'Session revoked' }, { status: 401 }),
        }
      }
    } else {
      const sessions = await getSessionsCollection()
      const session = await sessions.findOne({
        _id: new ObjectId(decoded.jti),
      })
      const valid =
        !!session &&
        session.userId.toString() === decoded.id &&
        session.status === 'active'
      sessionCache.set(decoded.jti, {
        valid,
        expiresAt: now + SESSION_CACHE_TTL_MS,
      })
      if (!valid) {
        return {
          error: NextResponse.json({ error: 'Session revoked' }, { status: 401 }),
        }
      }
    }
  }

  return {
    user: { id: decoded.id, role: decoded.role, jti: decoded.jti },
  }
}
