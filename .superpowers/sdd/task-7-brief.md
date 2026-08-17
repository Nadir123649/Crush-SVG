### Task 7: OAuth exchange route (`app/api/v1/oauth/[[...slug]]/route.ts`)

**Files:**
- Create: `app/api/v1/oauth/[[...slug]]/route.ts`

**Interfaces:**
- Consumes: `verifyIdToken` from `@/lib/firebase-admin`; `providerIdToName`, `resolveUserCascade` from `@/lib/firebase-user`; `createSession`, `getSessionsCollection` from `@/lib/sessions`; `buildTokenPayload` from `@/lib/tokens`; `oauthSchema` from `@/lib/validation`; `REFRESH_COOKIE_NAME`, `setRefreshCookie`, `toUserDTO` from `@/lib/auth` (cookie helpers exist from v1 — `setRefreshCookie` added in Task 8; for this task set the cookie inline to stay independent)
- Produces: POST handler; 200 `{ user: UserDTO, token: TokenPair, sessionId }` + refresh cookie; errors: 400 invalid body / missing token / provider mismatch, 403 `email_not_verified`, 401 firebase token failure, 429 rate limit, 404 unknown provider, 503 firebase not configured, 500
- Provider URL map: `{ google: 'google.com', github: 'github.com', x: 'twitter.com', password: 'password' }`
- Rate limit: in-memory counter, 10 req/min per provider key `oauth:<provider>` → 429 with `retryAfterSeconds`
- Password provider gate: `token.email_verified === false` → 403 `email_not_verified`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { verifyIdToken } from '@/lib/firebase-admin'
import { providerIdToName, resolveUserCascade } from '@/lib/firebase-user'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSession, getSessionsCollection } from '@/lib/sessions'
import { buildTokenPayload } from '@/lib/tokens'
import { oauthSchema } from '@/lib/validation'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

const PROVIDER_URL_MAP: Record<string, string> = {
  google: 'google.com',
  github: 'github.com',
  x: 'twitter.com',
  password: 'password',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const slug = (await params).slug
  const rawProvider = slug?.[0]
  const provider = rawProvider && PROVIDER_URL_MAP[rawProvider] ? rawProvider : undefined

  if (!provider) {
    return NextResponse.json(
      { error: 'Unknown provider' },
      { status: 404 }
    )
  }

  const rl = checkRateLimit(`oauth:${provider}`, 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.', retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = oauthSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const token = await verifyIdToken(parsed.data.firebaseToken)
    const expectedProviderId = PROVIDER_URL_MAP[provider]
    if (token.firebase?.sign_in_provider !== expectedProviderId) {
      return NextResponse.json(
        { error: 'Provider mismatch' },
        { status: 400 }
      )
    }
    if (provider === 'password' && !token.email_verified) {
      return NextResponse.json(
        { error: 'email_not_verified' },
        { status: 403 }
      )
    }

    const providerName = providerIdToName(token.firebase?.sign_in_provider ?? provider)
    const user = await resolveUserCascade(token, providerName)

    const sessions = await getSessionsCollection()
    const session = await createSession(sessions, {
      userId: user._id,
      provider: providerName,
      remember: parsed.data.rememberMe ?? true,
      ip: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      browser: undefined,
      os: undefined,
      deviceType: undefined,
    })

    const tokenPair = buildTokenPayload({
      id: user._id.toString(),
      role: 'free',
      sessionId: session._id.toString(),
      tokenVersion: session.tokenVersion,
    })

    const remember = parsed.data.rememberMe ?? true
    const res = NextResponse.json(
      {
        user: toUserDTO(user),
        token: tokenPair,
        sessionId: session._id.toString(),
      },
      { status: 200 }
    )
    res.cookies.set('crushsvg_refresh', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 7 * 24 * 60 * 60 : undefined,
    })
    return res
  } catch (error) {
    console.error('POST /api/v1/oauth failed:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx next build` — expected: no compile errors (warnings OK).

- [ ] **Step 3: Manual smoke check (needs .env + running Mongo)**

Run: `npm run dev` then in Postman:
1. Get idToken: `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<NEXT_PUBLIC_FIREBASE_API_KEY>` with `{ "email": "t@t.com", "password": "...", "returnSecureToken": true }`
2. `POST http://localhost:3000/api/v1/oauth/password` body `{ "firebaseToken": "<idToken>" }`
Expected: 200 `{ user, token, sessionId }`, `crushsvg_refresh` cookie set. Wrong provider (`oauth/google` with password token) → 400. Garbage token → 401.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/oauth/[[...slug]]/route.ts
git commit -m "feat: OAuth exchange route with provider linking and session issue"
```

---

