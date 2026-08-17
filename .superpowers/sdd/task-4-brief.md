### Task 4: Auth middleware + session cache (`src/lib/auth-middleware.ts`)

**Files:**
- Create: `src/lib/auth-middleware.ts`
- Test: `src/lib/auth-middleware.test.ts`

**Interfaces:**
- Consumes: `verifyAccessToken` from `@/lib/tokens`; `getSessionsCollection` from `@/lib/sessions`; `NextRequest`/`Response` from `next/server`
- Produces:
  - `interface AuthUser { id: string; role: string; jti?: string }`
  - `export function invalidateSessionCache(jti?: string): void`
  - `export async function auth(request: NextRequest): Promise<{ user: AuthUser } | { error: Response }>`
  - Origin check: non-GET/HEAD/OPTIONS requests must have Origin/Referer starting with an allowed origin (NEXT_PUBLIC_APP_URL or `http://localhost:3000`), else `{ error }` 403

- [ ] **Step 1: Write the failing test** (origin-check helper + cache behavior; DB path covered by Postman)

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

import { invalidateSessionCache, isAllowedOrigin, isMethodExempt } from '@/lib/auth-middleware'

describe('auth-middleware', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://crushsvg.com'
  })

  it('allows same-origin POST', () => {
    const req = new NextRequest('https://crushsvg.com/api/v1/oauth/google', {
      method: 'POST',
      headers: { origin: 'https://crushsvg.com' },
    })
    expect(isAllowedOrigin(req)).toBe(true)
  })

  it('rejects cross-origin POST', () => {
    const req = new NextRequest('https://crushsvg.com/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })
    expect(isAllowedOrigin(req)).toBe(false)
  })

  it('exempts GET from origin checks', () => {
    const req = new NextRequest('https://crushsvg.com/api/me', {
      method: 'GET',
      headers: { origin: 'https://evil.example' },
    })
    expect(isMethodExempt(req)).toBe(true)
  })

  it('invalidateSessionCache clears a single entry or everything', () => {
    invalidateSessionCache()
    expect(() => invalidateSessionCache()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/auth-middleware.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/lib/auth-middleware.ts**

```ts
import 'server-only'

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
        _id: new (await import('mongodb')).ObjectId(decoded.jti),
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/auth-middleware.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-middleware.ts src/lib/auth-middleware.test.ts
git commit -m "feat: auth middleware with bearer verify and session cache"
```

---

