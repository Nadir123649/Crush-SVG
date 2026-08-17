### Task 8: Refresh + logout routes

**Files:**
- Create: `app/api/v1/auth/refresh/route.ts`
- Create: `app/api/v1/auth/logout/route.ts`
- Create: `app/api/v1/auth/logout-all/route.ts`
- Modify: `src/lib/auth.ts` — add `REFRESH_COOKIE_NAME`, `setRefreshCookie(res, token, remember)`, `clearRefreshCookie(res)`, `getSessionUser(request)` (bearer-based, replaces cookie-based `getSessionUser`)

**Interfaces:**
- Consumes: `verifyRefreshToken`, `buildTokenPayload` from `@/lib/tokens`; `getSessionsCollection`, `rotateSession`, `getSessionRemember`, `getSessionTokenVersion`, `revokeAllSessions`, `revokeSession` from `@/lib/sessions`; `auth`, `invalidateSessionCache` from `@/lib/auth-middleware`; `getUsersCollection` from `@/lib/db`; `publishLogout` from `@/lib/session-broker`; `toUserDTO` etc. from `@/lib/auth`
- Produces:
  - `POST /api/v1/auth/refresh` — cookie-driven; rotates `tokenVersion`; race-tolerant: stale version + alive session → re-issue at current version, never delete cookie; revoked/missing session → 401 `session_revoked` + delete cookie; missing cookie → 200 `{ success: false, payload: { error: ... } }` (Puzz 11 shape, no throw)
  - `POST /api/v1/auth/logout` — bearer; revoke current session, invalidate cache, publishLogout, delete cookie, 200
  - `POST /api/v1/auth/logout-all` — bearer; revoke all, full cache clear, publishLogout, delete cookie, 200
  - `src/lib/auth.ts`: `getSessionUser(request: NextRequest): Promise<UserDoc | null>` via `auth()`; delete `setSessionCookie`/`clearSessionCookie`/`SESSION_COOKIE_NAME` (v1 cookie code)

- [ ] **Step 1: Delete old v1 auth routes (they import the cookie helpers being removed in this task)**

```bash
rm -r src/app/api/auth/session app/api/auth/reset-password
```

Verify with `rg "api/auth/session|reset-password" --glob "!node_modules"` — remaining hits must be docs only.

- [ ] **Step 2: Rewrite src/lib/auth.ts**

```ts
import 'server-only'

import type { NextRequest } from 'next/server'
import type { UserDoc } from '@/lib/db'

import { auth } from '@/lib/auth-middleware'
import { getUsersCollection } from '@/lib/db'

export const REFRESH_COOKIE_NAME = 'crushsvg_refresh'

export interface UserDTO {
  uid: string
  email: string | null
  displayName: string
  photoURL: string | null
  providers: string[]
  conversionsUsed: number
  createdAt: string
  lastLoginAt: string
}

export function toUserDTO(user: UserDoc): UserDTO {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providers: user.providers,
    conversionsUsed: user.conversionsUsed,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  }
}

export async function getSessionUser(request: NextRequest): Promise<UserDoc | null> {
  const who = await auth(request)
  if ('error' in who) return null
  const users = await getUsersCollection()
  return users.findOne({ _id: new (await import('mongodb')).ObjectId(who.user.id) })
}
```

(Note: keep `upsertUser` only if still referenced — after this task the cascade replaces it; remove it in this rewrite and drop `signInProvider` from `src/lib/firebase-admin.ts`, its last consumer is gone once the old routes are deleted in Step 1.)

- [ ] **Step 3: Write app/api/v1/auth/refresh/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionsCollection, rotateSession } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { getUsersCollection } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:refresh', 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, payload: { error: { code: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds } } },
      { status: 429 }
    )
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, version: '1.0.0', payload: { error: { code: 'token_missing' } }, serverTimestamp: new Date().toISOString() },
      { status: 200 }
    )
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken)

    const sessions = await getSessionsCollection()
    const result = await rotateSession(
      sessions,
      decoded.jti,
      decoded.ver ?? 0,
      new (await import('mongodb')).ObjectId(decoded.id)
    )

    if (!result.rotated) {
      const current = await sessions.findOne({
        _id: new (await import('mongodb')).ObjectId(decoded.jti),
      })
      const sessionActive =
        !!current &&
        current.status === 'active' &&
        current.userId.toString() === decoded.id
      if (!sessionActive) {
        const res = NextResponse.json(
          { success: false, version: '1.0.0', payload: { error: { code: 'session_revoked' } }, serverTimestamp: new Date().toISOString() },
          { status: 401 }
        )
        res.cookies.delete(REFRESH_COOKIE_NAME)
        return res
      }
    }

    const currentVersion = result.currentVersion
    const remember = result.remember

    const users = await getUsersCollection()
    const user = await users.findOne({ _id: new (await import('mongodb')).ObjectId(decoded.id) })
    if (!user) {
      const res = NextResponse.json(
        { success: false, version: '1.0.0', payload: { error: { code: 'user_not_found' } }, serverTimestamp: new Date().toISOString() },
        { status: 401 }
      )
      res.cookies.delete(REFRESH_COOKIE_NAME)
      return res
    }

    const tokenPair = buildTokenPayload({
      id: user._id.toString(),
      role: 'free',
      sessionId: decoded.jti,
      tokenVersion: currentVersion,
    })
    const res = NextResponse.json(
      { success: true, payload: { token: tokenPair }, timestamp: Date.now() },
      { status: 200 }
    )
    res.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 7 * 24 * 60 * 60 : undefined,
    })
    return res
  } catch {
    const res = NextResponse.json(
      { success: false, version: '1.0.0', payload: { error: { code: 'token_invalid' } }, serverTimestamp: new Date().toISOString() },
      { status: 200 }
    )
    res.cookies.delete(REFRESH_COOKIE_NAME)
    return res
  }
}
```

- [ ] **Step 4: Write app/api/v1/auth/logout/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, revokeSession } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  const res = NextResponse.json(
    { success: true, payload: { message: 'Logged out successfully' } },
    { status: 200 }
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)

  if ('user' in who) {
    const sessions = await getSessionsCollection()
    if (who.user.jti) {
      await revokeSession(sessions, who.user.jti, new (await import('mongodb')).ObjectId(who.user.id))
      invalidateSessionCache(who.user.jti)
      publishLogout(who.user.id)
    }
  }
  return res
}
```

- [ ] **Step 5: Write app/api/v1/auth/logout-all/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const sessions = await getSessionsCollection()
  await revokeAllSessions(
    sessions,
    new (await import('mongodb')).ObjectId(who.user.id),
    'logged_out'
  )
  invalidateSessionCache()
  publishLogout(who.user.id)

  const res = NextResponse.json(
    { success: true, payload: { message: 'Logged out from all devices' } },
    { status: 200 }
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
```

- [ ] **Step 6: Verify compile + smoke test**

Run: `npx next build` (no errors), then Postman: exchange → refresh (200, rotated token, cookie replaced) → logout (cookie gone, old access token now 401 on `/api/me`) → re-login → logout-all.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: refresh rotation, logout, logout-all routes; drop v1 session cookie routes"
```

---

