### Task 9: Sessions management routes

**Files:**
- Create: `app/api/v1/sessions/route.ts`
- Create: `app/api/v1/sessions/[id]/route.ts`

**Interfaces:**
- Consumes: `auth`, `invalidateSessionCache` from `@/lib/auth-middleware`; `getSessionsCollection`, `listActiveSessions`, `revokeAllSessions`, `revokeSession` from `@/lib/sessions`; `publishLogout` from `@/lib/session-broker`
- Produces:
  - `GET /api/v1/sessions` — 200 `{ sessions: SessionDTO[] }`; `SessionDTO = { id, provider, browser?, os?, deviceType?, ip?, remember, createdAt, lastSeenAt, status }`
  - `DELETE /api/v1/sessions` — 204, revoke all (`revoked`), full cache clear, publishLogout
  - `DELETE /api/v1/sessions/[id]` — 204, own-session check, 404 if missing, revoke + `invalidateSessionCache(id)` + publishLogout

- [ ] **Step 1: Write app/api/v1/sessions/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, listActiveSessions, revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const sessions = await getSessionsCollection()
  const docs = await listActiveSessions(
    sessions,
    new (await import('mongodb')).ObjectId(who.user.id)
  )
  return NextResponse.json(
    {
      sessions: docs.map((d) => ({
        id: d._id.toString(),
        provider: d.provider,
        browser: d.browser,
        os: d.os,
        deviceType: d.deviceType,
        ip: d.ip,
        remember: d.remember,
        createdAt: d.createdAt.toISOString(),
        lastSeenAt: d.lastSeenAt.toISOString(),
        status: d.status,
      })),
    },
    { status: 200 }
  )
}

export async function DELETE(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const sessions = await getSessionsCollection()
  await revokeAllSessions(
    sessions,
    new (await import('mongodb')).ObjectId(who.user.id),
    'revoked'
  )
  invalidateSessionCache()
  publishLogout(who.user.id)
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Write app/api/v1/sessions/[id]/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { getSessionsCollection, revokeSession } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const { id } = await params
  const sessions = await getSessionsCollection()
  const revoked = await revokeSession(
    sessions,
    id,
    new (await import('mongodb')).ObjectId(who.user.id)
  )
  if (!revoked) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  invalidateSessionCache(id)
  publishLogout(who.user.id)
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Verify compile + smoke test**

Run: `npx next build`; Postman: GET sessions (list), DELETE one (204, then that session's access token → 401), DELETE all (204).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/sessions/
git commit -m "feat: session list and revoke routes"
```

---

