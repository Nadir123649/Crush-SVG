### Task 10: Update /api/me + remove signInProvider

**Files:**
- Modify: `app/api/me/route.ts` (bearer auth via `auth()`, drop cookie session)
- Modify: `src/lib/firebase-admin.ts` — remove `signInProvider` (and its `DecodedIdToken` type import if then unused); keep `verifyIdToken`, `createSessionCookie`, `verifySessionCookie`, `generatePasswordResetLink` (createSessionCookie/verifySessionCookie now unused server-side — remove them too if `rg` shows no consumers; keep `generatePasswordResetLink` for the client-reset parity decision)
- Modify: `src/lib/db.ts` — nothing (users collection shape unchanged)

**Interfaces:**
- Consumes: `auth` from `@/lib/auth-middleware`; `getUsersCollection` from `@/lib/db`; `toUserDTO` from `@/lib/auth`
- Produces: `GET /api/me` — 200 `{ user }` / 401

- [ ] **Step 1: Rewrite app/api/me/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { getUsersCollection } from '@/lib/db'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const users = await getUsersCollection()
  const user = await users.findOne({
    _id: new (await import('mongodb')).ObjectId(who.user.id),
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json({ user: toUserDTO(user) }, { status: 200 })
}
```

- [ ] **Step 2: Remove signInProvider from src/lib/firebase-admin.ts**

Delete the `signInProvider` function; drop `type DecodedIdToken` from the import if no longer referenced. Verify consumers: `rg "signInProvider|verifySessionCookie|createSessionCookie" --glob "!node_modules"` — any remaining hits must be the intentionally kept helpers' own definitions only.

- [ ] **Step 3: Verify full build**

Run: `npx next build` — expected: no errors.

- [ ] **Step 4: Postman re-verify the full happy path**

Exchange → `/api/me` with Bearer token (200) → refresh → old access token on `/api/me` → 401 → new access token → 200.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/me/route.ts src/lib/firebase-admin.ts
git commit -m "feat: bearer auth on /api/me, drop unused firebase-admin helpers"
```

---

