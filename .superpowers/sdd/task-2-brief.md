### Task 2: JWT tokens (`src/lib/tokens.ts`)

**Files:**
- Create: `src/lib/tokens.ts`
- Test: `src/lib/tokens.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface TokenPair { tokenType: 'Bearer'; accessToken: string; accessTokenExpires: string; refreshToken: string; refreshTokenExpires: string }`
  - `interface DecodedAccessToken { id: string; role: string; jti?: string }`
  - `interface DecodedRefreshToken { id: string; jti: string; ver?: number }`
  - `generateAccessToken(input: { id: string; role: string; sessionId?: string }): string`
  - `generateRefreshToken(input: { id: string; sessionId: string; tokenVersion?: number }): string`
  - `buildTokenPayload(input: { id: string; role: string; sessionId?: string; tokenVersion?: number }): TokenPair`
  - `verifyAccessToken(token: string): Promise<DecodedAccessToken>`
  - `verifyRefreshToken(token: string): Promise<DecodedRefreshToken>`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll } from 'vitest'

import {
  buildTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/tokens'

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
})

describe('tokens', () => {
  it('verifies an access token and round-trips claims', async () => {
    const token = generateAccessToken({ id: 'user-1', role: 'free', sessionId: 'sess-1' })
    const decoded = await verifyAccessToken(token)
    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe('free')
    expect(decoded.jti).toBe('sess-1')
  })

  it('verifies a refresh token with version claim', async () => {
    const token = generateRefreshToken({ id: 'user-1', sessionId: 'sess-1', tokenVersion: 3 })
    const decoded = await verifyRefreshToken(token)
    expect(decoded.id).toBe('user-1')
    expect(decoded.jti).toBe('sess-1')
    expect(decoded.ver).toBe(3)
  })

  it('rejects tokens signed with the wrong secret', async () => {
    const token = generateAccessToken({ id: 'user-1', role: 'free' })
    process.env.JWT_ACCESS_SECRET = 'different-secret'
    await expect(verifyAccessToken(token)).rejects.toThrow()
    process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  })

  it('buildTokenPayload returns 4 token fields', () => {
    const pair = buildTokenPayload({ id: 'user-1', role: 'free', sessionId: 'sess-1', tokenVersion: 1 })
    expect(pair.tokenType).toBe('Bearer')
    expect(typeof pair.accessToken).toBe('string')
    expect(pair.accessTokenExpires).toBe('15m')
    expect(typeof pair.refreshToken).toBe('string')
    expect(pair.refreshTokenExpires).toBe('7d')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/tokens.test.ts`
Expected: FAIL — module `@/lib/tokens` not found.

- [ ] **Step 3: Write src/lib/tokens.ts**

```ts
import 'server-only'

import jwt from 'jsonwebtoken'

export interface TokenPair {
  tokenType: 'Bearer'
  accessToken: string
  accessTokenExpires: string
  refreshToken: string
  refreshTokenExpires: string
}

export interface DecodedAccessToken {
  id: string
  role: string
  jti?: string
}

export interface DecodedRefreshToken {
  id: string
  jti: string
  ver?: number
}

const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m'
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d'

function requireSecret(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set`)
  }
  return value
}

export function generateAccessToken(input: {
  id: string
  role: string
  sessionId?: string
}): string {
  return jwt.sign(
    { id: input.id, role: input.role, jti: input.sessionId },
    requireSecret('JWT_ACCESS_SECRET'),
    { expiresIn: ACCESS_EXPIRES, algorithm: 'HS256' }
  )
}

export function generateRefreshToken(input: {
  id: string
  sessionId: string
  tokenVersion?: number
}): string {
  const payload: Record<string, unknown> = { id: input.id, jti: input.sessionId }
  if (input.tokenVersion !== undefined) payload.ver = input.tokenVersion
  return jwt.sign(payload, requireSecret('JWT_REFRESH_SECRET'), {
    expiresIn: REFRESH_EXPIRES,
    algorithm: 'HS256',
  })
}

export function buildTokenPayload(input: {
  id: string
  role: string
  sessionId?: string
  tokenVersion?: number
}): TokenPair {
  return {
    tokenType: 'Bearer',
    accessToken: generateAccessToken({
      id: input.id,
      role: input.role,
      sessionId: input.sessionId,
    }),
    accessTokenExpires: ACCESS_EXPIRES,
    refreshToken: generateRefreshToken({
      id: input.id,
      sessionId: input.sessionId ?? '',
      tokenVersion: input.tokenVersion,
    }),
    refreshTokenExpires: REFRESH_EXPIRES,
  }
}

export function verifyAccessToken(token: string): Promise<DecodedAccessToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      requireSecret('JWT_ACCESS_SECRET'),
      { algorithms: ['HS256'] },
      (err, decoded) => {
        if (err || !decoded || typeof decoded !== 'object') {
          reject(err ?? new Error('Invalid token'))
          return
        }
        resolve({
          id: String(decoded.id),
          role: String(decoded.role ?? 'free'),
          jti: decoded.jti ? String(decoded.jti) : undefined,
        })
      }
    )
  })
}

export function verifyRefreshToken(token: string): Promise<DecodedRefreshToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      requireSecret('JWT_REFRESH_SECRET'),
      { algorithms: ['HS256'] },
      (err, decoded) => {
        if (err || !decoded || typeof decoded !== 'object' || !decoded.jti) {
          reject(err ?? new Error('Invalid token'))
          return
        }
        resolve({
          id: String(decoded.id),
          jti: String(decoded.jti),
          ver: typeof decoded.ver === 'number' ? decoded.ver : undefined,
        })
      }
    )
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/tokens.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokens.ts src/lib/tokens.test.ts
git commit -m "feat: JWT access/refresh token helpers"
```

---

