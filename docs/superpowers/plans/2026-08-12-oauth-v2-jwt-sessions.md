# OAuth v2 — JWT Session Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CrushSVG's Firebase-session-cookie auth with a Puzz 11-parity JWT session system: access/refresh tokens with rotation, LoginSession docs, sessions management, OAuth provider linking cascade, email-verification gate.

**Architecture:** Firebase remains the credential broker (popups + email/password → idToken). Every idToken is exchanged at `POST /api/v1/oauth/[provider]`; the backend verifies it, runs the user cascade (uid → email-bind → create), issues HS256 access (15m) + refresh (7d) JWTs bound to a `sessions` Mongo doc via `jti`, and stores the refresh token in an httpOnly cookie. Protected routes verify the bearer access token, check a 30s in-memory session cache, then the session doc status. Refresh rotates the session `tokenVersion` atomically with multi-tab race tolerance.

**Tech Stack:** Next.js 16 route handlers, MongoDB official driver (no mongoose), Firebase Admin SDK, jsonwebtoken, zod, vitest (new devDep).

## Global Constraints

- Next 16.3.0: read the relevant guide in `node_modules/next/dist/docs/` before writing any route handler; `params` is `Promise<{ slug?: string[] }>`; `cookies()` is async
- `runtime = 'nodejs'` on every new route
- Provider names (canonical, used in URLs, DB, cookies): `google`, `github`, `x`, `password` — Firebase provider ids map: `google.com`, `github.com`, `twitter.com`, `password`
- Access token 15m default (`ACCESS_TOKEN_EXPIRES`), refresh 7d default (`REFRESH_TOKEN_EXPIRES`), HS256 only, separate secrets `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- Refresh cookie: name `crushsvg_refresh`, httpOnly, Secure in production, SameSite=Lax, Path=/, 7d maxAge when `rememberMe`, session cookie otherwise
- Session status values: `active` | `logged_out` | `revoked`
- All route bodies validated with zod; password-provider exchanges gate on `token.email_verified` (403 `email_not_verified`)
- No comments in code unless the spec's own comments are copied; follow repo conventions (single quotes, no semicolons, `@/` imports)
- Remove old `/api/auth/session` + `/api/auth/reset-password` routes in the final task — clean break, no migration

---

### Task 1: Test infra, deps, env, validation schema

**Files:**
- Modify: `package.json` (deps + test script)
- Create: `vitest.config.ts`
- Modify: `.env.example`
- Modify: `lib/validation.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `oauthSchema` zod schema `{ firebaseToken: z.string().min(1), rememberMe: z.boolean().optional() }`; vitest runnable via `npm test`

- [ ] **Step 1: Install deps**

Run:
```bash
npm install jsonwebtoken
npm install -D vitest @types/jsonwebtoken
```

- [ ] **Step 2: Add test script to package.json**

Modify `package.json` scripts:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Update .env.example**

Append to `.env.example`:
```
# JWT session tokens (server — generate strong random values, e.g. `openssl rand -base64 48`)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

- [ ] **Step 5: Extend lib/validation.ts**

Append:
```ts
export const oauthSchema = z.object({
  firebaseToken: z.string().min(1, 'firebaseToken is required'),
  rememberMe: z.boolean().optional(),
})
```

- [ ] **Step 6: Verify**

Run: `npx vitest run --passWithNoTests`
Expected: exit 0, "No test files found" is fine.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.example lib/validation.ts
git commit -m "chore: add vitest, jwt deps, oauth schema, env vars"
```

---

### Task 2: JWT tokens (`lib/tokens.ts`)

**Files:**
- Create: `lib/tokens.ts`
- Test: `lib/tokens.test.ts`

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

Run: `npm test -- lib/tokens.test.ts`
Expected: FAIL — module `@/lib/tokens` not found.

- [ ] **Step 3: Write lib/tokens.ts**

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

Run: `npm test -- lib/tokens.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tokens.ts lib/tokens.test.ts
git commit -m "feat: JWT access/refresh token helpers"
```

---

### Task 3: Sessions collection + ops (`lib/sessions.ts`)

**Files:**
- Create: `lib/sessions.ts`
- Test: `lib/sessions.test.ts`

**Interfaces:**
- Consumes: `getMongoClient` from `@/lib/db`; `ObjectId` from `mongodb`
- Produces:
  - `interface SessionDoc { _id: ObjectId; userId: ObjectId; provider: string; remember: boolean; tokenVersion: number; status: 'active' | 'logged_out' | 'revoked'; rotatedAt: Date | null; lastSeenAt: Date; browser?: string; os?: string; deviceType?: string; ip?: string; userAgent?: string; createdAt: Date }`
  - `getSessionsCollection(): Promise<Collection<SessionDoc>>` (indexes: `{ userId: 1 }`, compound `{ userId: 1, deviceType: 1, browser: 1, os: 1 }`, TTL `{ lastSeenAt: 1 }` expireAfterSeconds 604800)
  - `createSession(c: Collection<SessionDoc>, input: { userId: ObjectId; provider: string; remember: boolean; ip?: string; userAgent?: string; browser?: string; os?: string; deviceType?: string }): Promise<SessionDoc>`
  - `listActiveSessions(c, userId: ObjectId): Promise<SessionDoc[]>`
  - `revokeSession(c, sessionId: string, userId: ObjectId): Promise<boolean>`
  - `revokeAllSessions(c, userId: ObjectId, status: 'logged_out' | 'revoked'): Promise<void>`
  - `getSessionTokenVersion(c, sessionId: string): Promise<number>`
  - `getSessionRemember(c, sessionId: string): Promise<boolean>`
  - `rotateSession(c, sessionId: string, expectedVersion: number, userId: ObjectId): Promise<{ rotated: boolean; currentVersion: number; remember: boolean }>`
  - Fingerprint reuse: existing active session with same `userId + deviceType + browser + os` is updated in place (fresh `createdAt`, keep `tokenVersion` and `status`), not re-inserted

- [ ] **Step 1: Write the failing test** (fake in-memory collection; collection param keeps it DB-free)

```ts
import { describe, it, expect } from 'vitest'
import { ObjectId, type Collection, type Document } from 'mongodb'

import {
  createSession,
  getSessionRemember,
  getSessionTokenVersion,
  listActiveSessions,
  revokeAllSessions,
  revokeSession,
  rotateSession,
  type SessionDoc,
} from '@/lib/sessions'

function fakeCollection(): Collection<SessionDoc> {
  const docs = new Map<string, SessionDoc>()
  const now = () => new Date()
  return {
    findOne: async (filter: Document) => {
      for (const doc of docs.values()) {
        if (filter._id && doc._id.toString() === String(filter._id)) return doc
        if (filter.userId && doc.userId.toString() === filter.userId.toString()) return doc
      }
      return null
    },
    find: (filter: Document) => ({
      sort: () => ({
        toArray: async () =>
          [...docs.values()].filter(
            (d) => d.userId.toString() === filter.userId.toString()
          ),
      }),
    }),
    insertOne: async (doc: SessionDoc) => {
      docs.set(doc._id.toString(), doc)
      return { insertedId: doc._id } as never
    },
    findOneAndUpdate: async (filter: Document, update: Document) => ({
      value: undefined,
      ok: 1,
    } as never),
    updateOne: async (filter: Document, update: Document) => {
      for (const doc of docs.values()) {
        if (doc._id.toString() === String(filter._id)) {
          if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
          return { modifiedCount: 1 } as never
        }
      }
      return { modifiedCount: 0 } as never
    },
    updateMany: async (filter: Document, update: Document) => {
      let n = 0
      for (const doc of docs.values()) {
        if (doc.userId.toString() === filter.userId.toString()) {
          if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
          n++
        }
      }
      return { modifiedCount: n } as never,
    },
    createIndex: async () => '',
  } as unknown as Collection<SessionDoc>
}

const userId = new ObjectId()

function baseSession(overrides: Partial<SessionDoc> = {}): SessionDoc {
  return {
    _id: new ObjectId(),
    userId,
    provider: 'google',
    remember: true,
    tokenVersion: 0,
    status: 'active',
    rotatedAt: null,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  }
}

describe('sessions', () => {
  it('creates a session and bumps lastSeenAt', async () => {
    const c = fakeCollection()
    const doc = await createSession(c, { userId, provider: 'google', remember: true })
    expect(doc.status).toBe('active')
    expect(doc.tokenVersion).toBe(0)
    expect(doc.lastSeenAt).toBeInstanceOf(Date)
  })

  it('reuses an active session with the same fingerprint instead of inserting', async () => {
    const c = fakeCollection()
    const first = await createSession(c, {
      userId,
      provider: 'google',
      remember: true,
      browser: 'chrome',
      os: 'windows',
      deviceType: 'desktop',
    })
    const second = await createSession(c, {
      userId,
      provider: 'password',
      remember: false,
      browser: 'chrome',
      os: 'windows',
      deviceType: 'desktop',
    })
    expect(second._id.toString()).toBe(first._id.toString())
    expect(second.tokenVersion).toBe(0)
    expect(second.provider).toBe('google')
  })

  it('rotateSession bumps tokenVersion atomically on match', async () => {
    const c = fakeCollection()
    const doc = await createSession(c, { userId, provider: 'google', remember: true })
    const input: { userId: ObjectId; expectedVersion: number } = {
      userId,
      expectedVersion: doc.tokenVersion,
    }
    const result = await rotateSession(c, doc._id.toString(), input.expectedVersion, userId)
    expect(result.rotated).toBe(true)
    expect(result.currentVersion).toBe(1)
    expect(result.remember).toBe(true)
  })

  it('rotateSession reports miss for a stale version', async () => {
    const c = fakeCollection()
    const doc = await createSession(c, { userId, provider: 'google', remember: true })
    const result = await rotateSession(c, doc._id.toString(), 99, userId)
    expect(result.rotated).toBe(false)
    expect(result.currentVersion).toBe(0)
  })

  it('lists only active sessions for a user', async () => {
    const c = fakeCollection()
    const other = new ObjectId()
    await createSession(c, { userId, provider: 'google', remember: true })
    await createSession(c, { userId: other, provider: 'google', remember: true })
    const list = await listActiveSessions(c, userId)
    expect(list).toHaveLength(1)
    expect(list[0].userId.toString()).toBe(userId.toString())
  })

  it('revokeSession flips status to revoked', async () => {
    const c = fakeCollection()
    const doc = await createSession(c, { userId, provider: 'google', remember: true })
    const ok = await revokeSession(c, doc._id.toString(), userId)
    expect(ok).toBe(true)
    const after = await c.findOne({ _id: doc._id })
    expect(after?.status).toBe('revoked')
  })

  it('revokeAllSessions flips every session', async () => {
    const c = fakeCollection()
    await createSession(c, { userId, provider: 'google', remember: true })
    await createSession(c, { userId, provider: 'x', remember: true, browser: 'firefox' })
    await revokeAllSessions(c, userId, 'logged_out')
    const list = await listActiveSessions(c, userId)
    expect(list).toHaveLength(0)
  })

  it('reads tokenVersion and remember defaults', async () => {
    const c = fakeCollection()
    const doc = await createSession(c, { userId, provider: 'google', remember: true })
    expect(await getSessionTokenVersion(c, doc._id.toString())).toBe(0)
    expect(await getSessionRemember(c, doc._id.toString())).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sessions.test.ts`
Expected: FAIL — `@/lib/sessions` not found.

- [ ] **Step 3: Write lib/sessions.ts**

```ts
import 'server-only'

import type { Collection, ObjectId } from 'mongodb'

import { getMongoClient } from '@/lib/db'

export type SessionStatus = 'active' | 'logged_out' | 'revoked'

export interface SessionDoc {
  _id: ObjectId
  userId: ObjectId
  provider: string
  remember: boolean
  tokenVersion: number
  status: SessionStatus
  rotatedAt: Date | null
  lastSeenAt: Date
  browser?: string
  os?: string
  deviceType?: string
  ip?: string
  userAgent?: string
  createdAt: Date
}

let sessionsIndexesEnsured = false

async function ensureIndexes(c: Collection<SessionDoc>): Promise<void> {
  if (sessionsIndexesEnsured) return
  await c.createIndex({ userId: 1 })
  await c.createIndex({ userId: 1, deviceType: 1, browser: 1, os: 1 })
  await c.createIndex({ lastSeenAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })
  sessionsIndexesEnsured = true
}

export async function getSessionsCollection(): Promise<Collection<SessionDoc>> {
  const client = getMongoClient()
  const collection = client.db('crushsvg').collection<SessionDoc>('sessions')
  await ensureIndexes(collection)
  return collection
}

export async function createSession(
  c: Collection<SessionDoc>,
  input: {
    userId: ObjectId
    provider: string
    remember: boolean
    ip?: string
    userAgent?: string
    browser?: string
    os?: string
    deviceType?: string
  }
): Promise<SessionDoc> {
  const fingerprint = {
    userId: input.userId,
    browser: input.browser,
    os: input.os,
    deviceType: input.deviceType,
  }
  const existing = await c.findOne({ ...fingerprint, status: 'active' })
  const now = new Date()

  if (existing) {
    await c.updateOne(
      { _id: existing._id },
      {
        $set: {
          provider: existing.provider,
          remember: input.remember,
          createdAt: now,
          lastSeenAt: now,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      }
    )
    return c.findOne({ _id: existing._id })!
  }

  const doc: SessionDoc = {
    _id: new (await import('mongodb')).ObjectId(),
    userId: input.userId,
    provider: input.provider,
    remember: input.remember,
    tokenVersion: 0,
    status: 'active',
    rotatedAt: null,
    lastSeenAt: now,
    browser: input.browser,
    os: input.os,
    deviceType: input.deviceType,
    ip: input.ip,
    userAgent: input.userAgent,
    createdAt: now,
  }
  await c.insertOne(doc)
  return doc
}

export async function listActiveSessions(
  c: Collection<SessionDoc>,
  userId: ObjectId
): Promise<SessionDoc[]> {
  return c
    .find({ userId, status: 'active' })
    .sort({ lastSeenAt: -1 })
    .toArray()
}

export async function revokeSession(
  c: Collection<SessionDoc>,
  sessionId: string,
  userId: ObjectId
): Promise<boolean> {
  const result = await c.updateOne(
    { _id: new (await import('mongodb')).ObjectId(sessionId), userId },
    { $set: { status: 'revoked' } }
  )
  return result.modifiedCount > 0
}

export async function revokeAllSessions(
  c: Collection<SessionDoc>,
  userId: ObjectId,
  status: SessionStatus
): Promise<void> {
  await c.updateMany({ userId, status: 'active' }, { $set: { status } })
}

export async function getSessionTokenVersion(
  c: Collection<SessionDoc>,
  sessionId: string
): Promise<number> {
  const doc = await c.findOne({ _id: new (await import('mongodb')).ObjectId(sessionId) })
  return doc?.tokenVersion ?? 0
}

export async function getSessionRemember(
  c: Collection<SessionDoc>,
  sessionId: string
): Promise<boolean> {
  const doc = await c.findOne({ _id: new (await import('mongodb')).ObjectId(sessionId) })
  return doc?.remember ?? true
}

export async function rotateSession(
  c: Collection<SessionDoc>,
  sessionId: string,
  expectedVersion: number,
  userId: ObjectId
): Promise<{ rotated: boolean; currentVersion: number; remember: boolean }> {
  const updated = await c.findOneAndUpdate(
    {
      _id: new (await import('mongodb')).ObjectId(sessionId),
      userId,
      tokenVersion: expectedVersion,
      status: 'active',
    },
    { $inc: { tokenVersion: 1 }, $set: { rotatedAt: new Date() } },
    { returnDocument: 'after' }
  )
  if (updated) {
    return {
      rotated: true,
      currentVersion: updated.tokenVersion,
      remember: updated.remember,
    }
  }

  const current = await c.findOne({
    _id: new (await import('mongodb')).ObjectId(sessionId),
  })
  if (!current || current.status !== 'active' || current.userId.toString() !== userId.toString()) {
    return { rotated: false, currentVersion: expectedVersion, remember: true }
  }
  return { rotated: false, currentVersion: current.tokenVersion, remember: current.remember }
}
```

> Note: `new (await import('mongodb')).ObjectId(...)` keeps the driver import static at the top of the module — replace with a top-level `import { ObjectId } from 'mongodb'` if preferred; the import above the `Collection` type import already exists. Use the top-level import.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/sessions.test.ts`
Expected: all tests PASS. (The fake `findOneAndUpdate` returns `undefined` value — `rotateSession` treats it as miss and falls back to `findOne`; adjust the fake if the fallback path is exercised differently.)

- [ ] **Step 5: Commit**

```bash
git add lib/sessions.ts lib/sessions.test.ts
git commit -m "feat: sessions collection with fingerprint reuse and rotation"
```

---

### Task 4: Auth middleware + session cache (`lib/auth-middleware.ts`)

**Files:**
- Create: `lib/auth-middleware.ts`
- Test: `lib/auth-middleware.test.ts`

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

Run: `npm test -- lib/auth-middleware.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write lib/auth-middleware.ts**

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

Run: `npm test -- lib/auth-middleware.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth-middleware.ts lib/auth-middleware.test.ts
git commit -m "feat: auth middleware with bearer verify and session cache"
```

---

### Task 5: SSE session broker (`lib/session-broker.ts`)

**Files:**
- Create: `lib/session-broker.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface SseController { enqueue(chunk: string): boolean; close(): void }`
  - `subscribe(userId: string, controller: SseController): void`
  - `unsubscribe(userId: string, controller: SseController): void`
  - `publishLogout(userId: string): number` — enqueues `data: logout\n\n` to every live controller, closes them, deletes the entry; returns subscriber count

- [ ] **Step 1: Write lib/session-broker.ts**

```ts
import 'server-only'

export interface SseController {
  enqueue(chunk: string): boolean
  close(): void
}

type ControllerSet = Set<SseController>

const subscribers = new Map<string, ControllerSet>()

export function subscribe(userId: string, controller: SseController): void {
  let set = subscribers.get(userId)
  if (!set) {
    set = new Set()
    subscribers.set(userId, set)
  }
  set.add(controller)
}

export function unsubscribe(userId: string, controller: SseController): void {
  const set = subscribers.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) subscribers.delete(userId)
}

export function publishLogout(userId: string): number {
  const set = subscribers.get(userId)
  if (!set) return 0
  const count = set.size
  for (const controller of set) {
    controller.enqueue('data: logout\n\n')
    controller.close()
  }
  subscribers.delete(userId)
  return count
}
```

- [ ] **Step 2: Verify build still passes (no test infra for Next-specific types here)**

Run: `npx next build 2>&1 | Select-String -Pattern "error|warn"` — expected: no errors (build may warn about other things; that's fine).

- [ ] **Step 3: Commit**

```bash
git add lib/session-broker.ts
git commit -m "feat: SSE logout session broker"
```

---

### Task 6: User cascade (`lib/firebase-user.ts`)

**Files:**
- Create: `lib/firebase-user.ts`
- Test: `lib/firebase-user.test.ts`

**Interfaces:**
- Consumes: `type DecodedIdToken` from `firebase-admin/auth`; `getUsersCollection`, `type UserDoc` from `@/lib/db`
- Produces:
  - `type ProviderName = 'google' | 'github' | 'x' | 'password'`
  - `providerIdToName(providerId: string): ProviderName` — map `google.com/github.com/twitter.com/password`, fallback returns providerId as-is
  - `resolveUserCascade(token: DecodedIdToken, provider: ProviderName, users?: Collection<UserDoc>): Promise<UserDoc>` — cascade: `uid` match → `email` match (bind provider, backfill photoURL/displayName) → create; always `$addToSet` provider, refresh profile, bump `lastLoginAt`/`updatedAt`
  - Delete `signInProvider` from `lib/firebase-admin.ts` (its only consumer `lib/auth.ts` is rewritten in Task 10)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { ObjectId, type Collection, type Document } from 'mongodb'

import {
  providerIdToName,
  resolveUserCascade,
  type ProviderName,
} from '@/lib/firebase-user'
import { type UserDoc } from '@/lib/db'

type Token = { uid: string; email?: string | null; name?: string | null; picture?: string | null }

function fakeUsers(): Collection<UserDoc> {
  const docs: UserDoc[] = []
  return {
    findOne: async (filter: Document) =>
      docs.find((d) =>
        filter.uid
          ? d.uid === filter.uid
          : filter.email === d.email
      ) ?? null,
    insertOne: async (doc: UserDoc) => {
      docs.push(doc)
      return { insertedId: doc._id } as never
    },
    findOneAndUpdate: async (filter: Document, update: Document) => {
      let doc = docs.find((d) => filter.uid === d.uid)
      const now = new Date()
      if (!doc && filter.email) doc = docs.find((d) => filter.email === d.email)
      if (!doc) {
        doc = {
          _id: new ObjectId(),
          uid: String(filter.uid ?? ''),
          email: (filter.email as string) ?? null,
          displayName: 'CrushSVG user',
          photoURL: null,
          providers: [],
          conversionsUsed: 0,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        }
        docs.push(doc)
        return { value: doc } as never
      }
      const set = (update.$set ?? {}) as Record<string, unknown>
      const add = (update.$addToSet?.providers?.$each as string[]) ?? []
      const insert = (update.$setOnInsert ?? {}) as Record<string, unknown>
      Object.assign(doc, set)
      for (const into of ['conversionsUsed', 'createdAt'] as const) {
        const key = into
        if (insert[key] !== undefined && doc[key] === undefined) {
        }
      }
      for (const p of add) if (!doc.providers.includes(p)) doc.providers.push(p)
      return { value: doc } as never
    },
    createIndex: async () => '',
  } as unknown as Collection<UserDoc>
}

describe('firebase-user', () => {
  it('maps firebase provider ids to names', () => {
    expect(providerIdToName('google.com')).toBe('google')
    expect(providerIdToName('github.com')).toBe('github')
    expect(providerIdToName('twitter.com')).toBe('x')
    expect(providerIdToName('password')).toBe('password')
  })

  it('creates a user when uid and email are both new', async () => {
    const users = fakeUsers()
    const token: Token = {
      uid: 'fb-1',
      email: 'a@b.com',
      name: 'Alice',
      picture: 'https://p',
    }
    const user = await resolveUserCascade(
      token as never,
      'google' as ProviderName,
      users
    )
    expect(user.uid).toBe('fb-1')
    expect(user.email).toBe('a@b.com')
    expect(user.providers).toContain('google')
    expect(user.conversionsUsed).toBe(0)
  })

  it('binds a firebase uid onto an existing email match', async () => {
    const users = fakeUsers()
    await resolveUserCascade(
      { uid: 'fb-old', email: 'same@x.com', name: 'A' } as never,
      'password' as ProviderName,
      users
    )
    const user = await resolveUserCascade(
      { uid: 'fb-new', email: 'SAME@x.com', name: 'B' } as never,
      'google' as ProviderName,
      users
    )
    expect(user.uid).toBe('fb-new')
    expect(user.providers).toContain('password')
    expect(user.providers).toContain('google')
  })

  it('dedupes providers on repeat login', async () => {
    const users = fakeUsers()
    const token = { uid: 'fb-1', email: 'a@b.com', name: 'A' } as never
    await resolveUserCascade(token, 'google' as ProviderName, users)
    const user = await resolveUserCascade(token, 'google' as ProviderName, users)
    expect(user.providers.filter((p) => p === 'google')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/firebase-user.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write lib/firebase-user.ts**

```ts
import 'server-only'

import type { Collection } from 'mongodb'
import type { DecodedIdToken } from 'firebase-admin/auth'

import { getUsersCollection, type UserDoc } from '@/lib/db'

export type ProviderName = 'google' | 'github' | 'x' | 'password'

export function providerIdToName(providerId: string): ProviderName {
  switch (providerId) {
    case 'google.com':
      return 'google'
    case 'github.com':
      return 'github'
    case 'twitter.com':
      return 'x'
    case 'password':
      return 'password'
    default:
      return providerId as ProviderName
  }
}

export async function resolveUserCascade(
  token: DecodedIdToken,
  provider: ProviderName,
  users?: Collection<UserDoc>
): Promise<UserDoc> {
  const collection = users ?? (await getUsersCollection())
  const now = new Date()
  const email = token.email ? token.email.toLowerCase().trim() : null

  const existing = await collection.findOne({ uid: token.uid })
  if (existing) {
    return (
      (await collection.findOneAndUpdate(
        { uid: token.uid },
        {
          $set: {
            email: token.email ?? existing.email,
            displayName: token.name ?? existing.displayName,
            photoURL: token.picture ?? existing.photoURL,
            updatedAt: now,
            lastLoginAt: now,
          },
          $addToSet: { providers: provider },
        },
        { returnDocument: 'after' }
      )) ?? existing
    )
  }

  if (email) {
    const emailMatch = await collection.findOne({ email })
    if (emailMatch) {
      return (
        (await collection.findOneAndUpdate(
          { _id: emailMatch._id },
          {
            $set: {
              uid: token.uid,
              displayName: token.name ?? emailMatch.displayName,
              photoURL: token.picture ?? emailMatch.photoURL,
              updatedAt: now,
              lastLoginAt: now,
            },
            $addToSet: { providers: provider },
          },
          { returnDocument: 'after' }
        )) ?? emailMatch
      )
    }
  }

  const doc: UserDoc = {
    _id: new (await import('mongodb')).ObjectId(),
    uid: token.uid,
    email: email ?? token.email ?? null,
    displayName: token.name ?? 'CrushSVG user',
    photoURL: token.picture ?? null,
    providers: [provider],
    conversionsUsed: 0,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  }
  await collection.insertOne(doc)
  return doc
}
```

- [ ] **Step 4: Remove signInProvider from lib/firebase-admin.ts**

Delete the `signInProvider` function and its `DecodedIdToken` type import if unused there (verify with `rg "signInProvider"` — only `lib/auth.ts` imports it, rewritten in Task 10; keep `verifyIdToken`, `createSessionCookie`, `verifySessionCookie`, `generatePasswordResetLink` for a moment, all consumers rewritten by Task 10-11).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/firebase-user.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/firebase-user.ts lib/firebase-user.test.ts lib/firebase-admin.ts
git commit -m "feat: OAuth user resolution cascade with provider linking"
```

---

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

const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean
  retryAfterSeconds: number
} {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }
  bucket.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
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
git add app/api/v1/oauth/[[...slug]]/route.ts
git commit -m "feat: OAuth exchange route with provider linking and session issue"
```

---

### Task 8: Refresh + logout routes

**Files:**
- Create: `app/api/v1/auth/refresh/route.ts`
- Create: `app/api/v1/auth/logout/route.ts`
- Create: `app/api/v1/auth/logout-all/route.ts`
- Modify: `lib/auth.ts` — add `REFRESH_COOKIE_NAME`, `setRefreshCookie(res, token, remember)`, `clearRefreshCookie(res)`, `getSessionUser(request)` (bearer-based, replaces cookie-based `getSessionUser`)

**Interfaces:**
- Consumes: `verifyRefreshToken`, `buildTokenPayload` from `@/lib/tokens`; `getSessionsCollection`, `rotateSession`, `getSessionRemember`, `getSessionTokenVersion`, `revokeAllSessions`, `revokeSession` from `@/lib/sessions`; `auth`, `invalidateSessionCache` from `@/lib/auth-middleware`; `getUsersCollection` from `@/lib/db`; `publishLogout` from `@/lib/session-broker`; `toUserDTO` etc. from `@/lib/auth`
- Produces:
  - `POST /api/v1/auth/refresh` — cookie-driven; rotates `tokenVersion`; race-tolerant: stale version + alive session → re-issue at current version, never delete cookie; revoked/missing session → 401 `session_revoked` + delete cookie; missing cookie → 200 `{ success: false, payload: { error: ... } }` (Puzz 11 shape, no throw)
  - `POST /api/v1/auth/logout` — bearer; revoke current session, invalidate cache, publishLogout, delete cookie, 200
  - `POST /api/v1/auth/logout-all` — bearer; revoke all, full cache clear, publishLogout, delete cookie, 200
  - `lib/auth.ts`: `getSessionUser(request: NextRequest): Promise<UserDoc | null>` via `auth()`; delete `setSessionCookie`/`clearSessionCookie`/`SESSION_COOKIE_NAME` (v1 cookie code)

- [ ] **Step 1: Rewrite lib/auth.ts**

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

(Note: keep `upsertUser` only if still referenced — after Task 10 the cascade replaces it; remove it in Task 10.)

- [ ] **Step 2: Write app/api/v1/auth/refresh/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'

import { getSessionsCollection, getSessionRemember, rotateSession } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { getUsersCollection } from '@/lib/db'

export const runtime = 'nodejs'

const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:refresh', 120, 60_000)
  if (!rl) {
    return NextResponse.json({ success: false, payload: { error: { code: 'rate_limited' } } }, { status: 429 })
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

- [ ] **Step 3: Write app/api/v1/auth/logout/route.ts**

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

- [ ] **Step 4: Write app/api/v1/auth/logout-all/route.ts**

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

- [ ] **Step 5: Verify compile + smoke test**

Run: `npx next build` (no errors), then Postman: exchange → refresh (200, rotated token, cookie replaced) → logout (cookie gone, old access token now 401 on `/api/me`) → re-login → logout-all.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/api/v1/auth/
git commit -m "feat: refresh rotation, logout, logout-all routes"
```

---

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
git add app/api/v1/sessions/
git commit -m "feat: session list and revoke routes"
```

---

### Task 10: Update /api/me + remove v1 auth routes

**Files:**
- Modify: `app/api/me/route.ts` (bearer auth via `auth()`, drop cookie session)
- Delete: `app/api/auth/session/route.ts`
- Delete: `app/api/auth/reset-password/route.ts`
- Modify: `lib/db.ts` — nothing (users collection shape unchanged)

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

- [ ] **Step 2: Delete old routes**

```bash
rm app/api/auth/session/route.ts app/api/auth/reset-password/route.ts
rm -r app/api/auth/session app/api/auth/reset-password 2>$null
```

- [ ] **Step 3: Sweep dead references**

Run `rg "createSessionCookie|verifySessionCookie|generatePasswordResetLink|exchangeIdToken|clearSessionCookie|setSessionCookie|SESSION_COOKIE_NAME|upsertUser" --glob "!node_modules"` — remaining hits must be `lib/firebase-admin.ts` (kept helpers, now unused server-side but harmless) and `lib/firebase-client.ts` (rewritten in Task 11). Remove `signInProvider` if still present in `lib/firebase-admin.ts` and unused.

- [ ] **Step 4: Verify full build**

Run: `npx next build` — expected: no errors.

- [ ] **Step 5: Postman re-verify the full happy path**

Exchange → `/api/me` with Bearer token (200) → refresh → old access token on `/api/me` → 401 → new access token → 200.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: bearer auth on /api/me, remove Firebase session-cookie routes"
```

---

### Task 11: Client helpers (`lib/firebase-client.ts`)

**Files:**
- Modify: `lib/firebase-client.ts`

**Interfaces:**
- Consumes: existing Firebase client SDK helpers
- Produces:
  - `exchangeIdToken(rememberMe = true): Promise<{ user: UserDTO; token: TokenPair }>` — detects provider from `currentUser.providerData[0].providerId`, POSTs `/api/v1/oauth/<provider>`
  - `signOut()` — `DELETE /api/v1/auth/logout` then Firebase signOut
  - `resendVerificationEmail()` — `sendEmailVerification(currentUser)`
  - `getErrorMessage` gains: `email_not_verified` → "Please verify your email before logging in", `auth/too-many-requests` → "Too many attempts — wait a bit and try again", 429 → same message

- [ ] **Step 1: Rewrite the affected parts of lib/firebase-client.ts**

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
git add lib/firebase-client.ts
git commit -m "feat: client auth helpers for OAuth exchange, logout-all, resend verification"
```

---

### Task 12: Final sweep — lint, build, full Postman pass

**Files:**
- All touched files

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors. Fix any style issues found, rerun.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all unit tests pass (tokens, sessions, auth-middleware, firebase-user).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Complete Postman regression (spec §Testing)**

1. idToken via identitytoolkit `signInWithPassword`
2. `POST /api/v1/oauth/password` → 200, cookie set
3. `GET /api/me` Bearer → 200
4. `POST /api/v1/auth/refresh` → 200, rotated cookie; old access token now 401
5. `GET /api/v1/sessions` → 200 list (1 active session)
6. `DELETE /api/v1/sessions` → 204; access token → 401
7. Login again → `DELETE /api/v1/sessions/[id]` → 204 → 401
8. Errors: `oauth/google` with password idToken → 400; unverified email → 403; junk token → 401; missing body → 400; 11 rapid oauth calls → 429
9. Provider linking: login with email → `POST /api/v1/oauth/google` with Google popup token (browser console) → same Mongo user, `providers` = `["password","google"]`

- [ ] **Step 5: Update README if it documents auth endpoints**

Run `rg -i "api/auth/session|reset-password" README.md AGENTS.md CLAUDE.md` — update any stale endpoint docs.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: final auth v2 lint, tests, and docs sweep"
```

---

## Self-Review Notes

- Spec §API surface: all 8 endpoints covered (Task 7 oauth, Task 8 refresh/logout/logout-all, Task 9 sessions ×3, Task 10 /api/me)
- Spec §tokens: Task 2; §sessions collection: Task 3; §auth-middleware: Task 4; §broker: Task 5; §cascade: Task 6; §client: Task 11; §removal: Task 10; §env: Task 1
- Spec out-of-scope items deliberately absent: guest docs, usernames, geo, brute-force (Firebase-owned), verification UI
- Rate limits on 3 routes (oauth/refresh + logout paths left unthrottled — logout/logout-all rely on bearer auth; oauth + refresh throttled per spec)
- Sessions list DTO drops `tokenVersion`/`rotatedAt` (internal), keeps `remember`, `status`