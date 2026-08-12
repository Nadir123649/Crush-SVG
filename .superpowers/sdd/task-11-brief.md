### Task 11: Client helpers (`src/lib/firebase-client.ts`)

**Files:**
- Modify: `src/lib/firebase-client.ts`

**Interfaces:**
- Consumes: existing Firebase client SDK helpers
- Produces:
  - `exchangeIdToken(rememberMe = true): Promise<{ user: UserDTO; token: TokenPair }>` — detects provider from `currentUser.providerData[0].providerId`, POSTs `/api/v1/oauth/<provider>`
  - `signOut()` — `DELETE /api/v1/auth/logout` then Firebase signOut
  - `resendVerificationEmail()` — `sendEmailVerification(currentUser)`
  - `getErrorMessage` gains: `email_not_verified` → "Please verify your email before logging in", `auth/too-many-requests` → "Too many attempts — wait a bit and try again", 429 → same message

- [ ] **Step 1: Rewrite the affected parts of src/lib/firebase-client.ts**

```ts
import {
  sendEmailVerification,
  ...existing imports,
} from 'firebase/auth'

const PROVIDER_URL_MAP: Record<string, string> = {
  'google.com': 'google',
  'github.com': 'github',
  'twitter.com': 'x',
  'password': 'password',
}

export interface SessionResponse {
  user: {
    uid: string
    email: string | null
    displayName: string
    photoURL: string | null
    providers: string[]
    conversionsUsed: number
    createdAt: string
    lastLoginAt: string
  }
  token: {
    tokenType: 'Bearer'
    accessToken: string
    accessTokenExpires: string
    refreshToken: string
    refreshTokenExpires: string
  }
}

export async function exchangeIdToken(rememberMe = true): Promise<SessionResponse> {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) {
    throw new Error('Not signed in')
  }
  const providerId = currentUser.providerData[0]?.providerId ?? 'password'
  const provider = PROVIDER_URL_MAP[providerId] ?? 'password'
  const idToken = await currentUser.getIdToken()
  const response = await fetch(`/api/v1/oauth/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebaseToken: idToken, rememberMe }),
  })
  if (response.status === 403) {
    throw new Error('email_not_verified')
  }
  if (!response.ok) {
    throw new Error('Failed to create session')
  }
  return response.json()
}

export async function resendVerificationEmail(): Promise<void> {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) {
    throw new Error('Not signed in')
  }
  await sendEmailVerification(currentUser)
}

export async function signOut() {
  await fetch('/api/v1/auth/logout', { method: 'POST' })
  await firebaseSignOut(getFirebaseAuth())
}
```

Add to `getErrorMessage` cases:
```ts
case 'email_not_verified':
  return 'Please verify your email before logging in'
case 'auth/too-many-requests':
  return 'Too many attempts — wait a bit and try again'
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firebase-client.ts
git commit -m "feat: client auth helpers for OAuth exchange, logout-all, resend verification"
```

---

