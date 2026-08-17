# Mongoose Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw `mongodb` driver with mongoose as the single DB layer across all 33 affected files, configured against the new Atlas cluster.

**Architecture:** Three mongoose models (`User`, `Session`, `GuestUsage`) in `src/lib/models/`, a singleton connection in `src/lib/db.ts` that re-exports the models and types, helpers in `sessions.ts`/`guest-usage.ts` rewritten to call models directly, and ~20 route/test files converted to model calls.

**Tech Stack:** mongoose 9.9.2 (already installed), Next.js 16 route handlers, vitest, TypeScript 5.

## Global Constraints

- All routes keep `export const runtime = 'nodejs'`.
- API response shapes, status codes, and error codes are unchanged.
- `mongodb` stays in package.json (mongoose peer dependency) — only source imports change.
- No new dependencies. No data migration — schemas map 1:1 onto existing documents.
- `password` field has NO `select: false` — preserves today's behavior where DTOs compute `hasPassword` from the doc; DTOs never serialize the hash.
- mongoose `findOneAndUpdate` must pass `{ new: true }`.
- Explicit `createdAt`/`updatedAt` in `$set`/inserts are dropped — mongoose `timestamps: true` handles them.
- Every `import { ObjectId } from 'mongodb'` and `new (await import('mongodb')).ObjectId(...)` is removed from source files.
- Per-task verification: `npx tsc --noEmit` (whole repo — only files in this and earlier tasks must be clean) and `npx vitest run <paths>`.

---

### Task 1: Models + connection layer

**Files:**
- Create: `src/lib/models/user.ts`
- Create: `src/lib/models/session.ts`
- Create: `src/lib/models/guest-usage.ts`
- Rewrite: `src/lib/db.ts`
- Modify: `.env`, `.env.example`

**Interfaces:**
- Produces: `User`, `Session`, `GuestUsage` models and `UserDoc`, `SessionDoc`, `SessionStatus`, `GuestUsageDoc` types, re-exported from `@/lib/db`. `connectToDatabase(): Promise<Connection>`.

- [ ] **Step 1: Create `src/lib/models/user.ts`**

```ts
import 'server-only'

import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface UserDoc {
  _id: Types.ObjectId
  uid: string
  email: string | null
  displayName: string
  name?: string | null
  photoURL: string | null
  providers: string[]
  linkedProviders?: string[]
  password?: string
  isVerified?: boolean
  emailVerificationToken?: string
  emailVerificationTokenExpire?: number
  resetPasswordToken?: string
  resetPasswordTokenExpire?: number
  conversionsUsed: number
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date
}

const userSchema = new Schema(
  {
    uid: { type: String, required: true },
    email: { type: String, default: null },
    displayName: { type: String, required: true },
    name: { type: String },
    photoURL: { type: String, default: null },
    providers: { type: [String], default: [] },
    linkedProviders: { type: [String] },
    password: { type: String },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpire: { type: Number },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpire: { type: Number },
    conversionsUsed: { type: Number, default: 0 },
    lastLoginAt: { type: Date, required: true },
  },
  { timestamps: true }
)

userSchema.index({ uid: 1 }, { unique: true })
userSchema.index({ email: 1 }, { unique: true, sparse: true })

export const User = (models.User ?? model<UserDoc>('User', userSchema)) as Model<UserDoc>
```

- [ ] **Step 2: Create `src/lib/models/session.ts`**

```ts
import 'server-only'

import { Schema, model, models, type Model, type Types } from 'mongoose'

export type SessionStatus = 'active' | 'logged_out' | 'revoked'

export interface SessionDoc {
  _id: Types.ObjectId
  userId: Types.ObjectId
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
  updatedAt: Date
}

const sessionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true },
    remember: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'logged_out', 'revoked'], default: 'active' },
    rotatedAt: { type: Date, default: null },
    lastSeenAt: { type: Date, required: true },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
)

sessionSchema.index({ userId: 1, deviceType: 1, browser: 1, os: 1 })
sessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })

export const Session = (models.Session ?? model<SessionDoc>('Session', sessionSchema)) as Model<SessionDoc>
```

- [ ] **Step 3: Create `src/lib/models/guest-usage.ts`**

```ts
import 'server-only'

import { Schema, model, models, type Model } from 'mongoose'

export interface GuestUsageDoc {
  _id: string
  conversionsUsed: number
  createdAt: Date
  updatedAt: Date
}

const guestUsageSchema = new Schema(
  {
    _id: { type: String, required: true },
    conversionsUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
)

guestUsageSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export const GuestUsage = (models.GuestUsage ?? model<GuestUsageDoc>('GuestUsage', guestUsageSchema)) as Model<GuestUsageDoc>
```

- [ ] **Step 4: Rewrite `src/lib/db.ts`**

Replace the entire file:

```ts
import 'server-only'

import dns from 'node:dns'
import { connect, type Connection } from 'mongoose'

import { User } from '@/lib/models/user'
import { Session } from '@/lib/models/session'
import { GuestUsage } from '@/lib/models/guest-usage'

export { User, Session, GuestUsage }

export type { UserDoc } from '@/lib/models/user'
export type { SessionDoc, SessionStatus } from '@/lib/models/session'
export type { GuestUsageDoc } from '@/lib/models/guest-usage'

declare global {
  var __crushSvgMongoose: Promise<Connection> | undefined
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI must be set')
  }
  return uri
}

export async function connectToDatabase(): Promise<Connection> {
  const cached = globalThis.__crushSvgMongoose
  if (cached) return cached

  const dnsServers = process.env.DNS_SERVERS
  if (dnsServers) {
    dns.setServers(dnsServers.split(',').map((s) => s.trim()))
  }

  const dbName = process.env.MONGODB_DB_NAME || 'crushsvg'
  const promise = connect(getMongoUri(), {
    dbName,
    appName: 'crushsvg',
    serverSelectionTimeoutMS: 5000,
  })
    .then((conn) => {
      console.log('Connected to MongoDB successfully')
      return conn
    })
    .catch((err) => {
      globalThis.__crushSvgMongoose = undefined
      console.error('Failed to connect to MongoDB:', err)
      throw err
    })

  globalThis.__crushSvgMongoose = promise
  return promise
}
```

- [ ] **Step 5: Update `.env`**

Replace line 15 with:

```
MONGODB_URI=mongodb+srv://holapushpush_db_user:PzCOwkBLf1W7YNIF@crushsvg.cfpuwzi.mongodb.net/
```

Add below it:

```
MONGODB_DB_NAME=crushsvg
```

- [ ] **Step 6: Update `.env.example`**

Add below the `MONGODB_URI=` line:

```
MONGODB_DB_NAME=crushsvg
```

- [ ] **Step 7: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/models/*` or `src/lib/db.ts`. (Errors in route files referencing removed `getUsersCollection` etc. are expected at this stage — later tasks fix them.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/models src/lib/db.ts .env .env.example
git commit -m "feat: add mongoose models and singleton connection"
```

---

### Task 2: Session helpers -> mongoose

**Files:**
- Rewrite: `src/lib/sessions.ts`
- Rewrite: `src/lib/sessions.test.ts`

**Interfaces:**
- Consumes: `Session` model + `SessionDoc`/`SessionStatus` types from `@/lib/db` (Task 1).
- Produces: same-named helpers with the collection parameter removed: `createSession(input): Promise<SessionDoc>`, `listActiveSessions(userId): Promise<SessionDoc[]>`, `revokeSession(sessionId: string, userId): Promise<boolean>`, `revokeAllSessions(userId, status)`, `getSessionTokenVersion(sessionId)`, `getSessionRemember(sessionId)`, `rotateSession(sessionId, expectedVersion, userId): Promise<{ rotated; currentVersion; remember }>`. `userId` param type: `Types.ObjectId | string`.

- [ ] **Step 1: Rewrite `src/lib/sessions.ts`**

Replace the entire file:

```ts
import 'server-only'

import type { Types } from 'mongoose'

import { Session, type SessionDoc } from '@/lib/db'

export type { SessionStatus } from '@/lib/db'

export type SessionUserId = Types.ObjectId | string

export async function createSession(input: {
  userId: SessionUserId
  provider: string
  remember: boolean
  ip?: string
  userAgent?: string
  browser?: string
  os?: string
  deviceType?: string
}): Promise<SessionDoc> {
  const fingerprint = {
    userId: input.userId,
    browser: input.browser,
    os: input.os,
    deviceType: input.deviceType,
  }
  const existing = await Session.findOne({ ...fingerprint, status: 'active' })
  const now = new Date()

  if (existing) {
    await Session.updateOne(
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
    return (await Session.findOne({ _id: existing._id }))!
  }

  return Session.create({
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
  })
}

export async function listActiveSessions(userId: SessionUserId): Promise<SessionDoc[]> {
  return Session.find({ userId, status: 'active' }).sort({ lastSeenAt: -1 })
}

export async function revokeSession(sessionId: string, userId: SessionUserId): Promise<boolean> {
  const result = await Session.updateOne(
    { _id: sessionId, userId },
    { $set: { status: 'revoked' } }
  )
  return result.modifiedCount > 0
}

export async function revokeAllSessions(
  userId: SessionUserId,
  status: 'logged_out' | 'revoked'
): Promise<void> {
  await Session.updateMany({ userId, status: 'active' }, { $set: { status } })
}

export async function getSessionTokenVersion(sessionId: string): Promise<number> {
  const doc = await Session.findById(sessionId)
  return doc?.tokenVersion ?? 0
}

export async function getSessionRemember(sessionId: string): Promise<boolean> {
  const doc = await Session.findById(sessionId)
  return doc?.remember ?? true
}

export async function rotateSession(
  sessionId: string,
  expectedVersion: number,
  userId: SessionUserId
): Promise<{ rotated: boolean; currentVersion: number; remember: boolean }> {
  const updated = await Session.findOneAndUpdate(
    { _id: sessionId, userId, tokenVersion: expectedVersion, status: 'active' },
    { $inc: { tokenVersion: 1 }, $set: { rotatedAt: new Date() } },
    { new: true }
  )
  if (updated) {
    return {
      rotated: true,
      currentVersion: updated.tokenVersion,
      remember: updated.remember,
    }
  }

  const current = await Session.findById(sessionId)
  if (!current || current.status !== 'active' || current.userId.toString() !== userId.toString()) {
    return { rotated: false, currentVersion: expectedVersion, remember: true }
  }
  return { rotated: false, currentVersion: current.tokenVersion, remember: current.remember }
}
```

- [ ] **Step 2: Rewrite `src/lib/sessions.test.ts`**

Replace the entire file. The fake in-memory collection becomes a fake `Session` model; the model mock uses a getter so `beforeEach` can swap fresh instances:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types, type Document } from 'mongoose'

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

const mocks = vi.hoisted(() => {
  function makeModel() {
    const docs = new Map<string, SessionDoc>()
    const matches = (doc: SessionDoc, filter: Document): boolean =>
      Object.entries(filter).every(([key, value]) => {
        const actual = (doc as unknown as Record<string, unknown>)[key]
        if (actual === undefined || value === undefined) return actual === value
        return String(actual) === String(value)
      })
    return {
      findOne: async (filter: Document) => {
        for (const doc of docs.values()) {
          if (matches(doc, filter)) return doc
        }
        return null
      },
      findById: async (id: string) => {
        for (const doc of docs.values()) {
          if (doc._id.toString() === id.toString()) return doc
        }
        return null
      },
      find: (filter: Document) => ({
        sort: () => ({
          then: (resolve: (v: SessionDoc[]) => void) =>
            resolve([...docs.values()].filter((d) => matches(d, filter))),
        }),
      }),
      create: async (doc: Partial<SessionDoc>) => {
        const full: SessionDoc = {
          _id: new Types.ObjectId(),
          userId: doc.userId as Types.ObjectId,
          provider: doc.provider ?? 'password',
          remember: doc.remember ?? true,
          tokenVersion: 0,
          status: 'active',
          rotatedAt: null,
          lastSeenAt: doc.lastSeenAt ?? new Date(),
          createdAt: doc.createdAt ?? new Date(),
          updatedAt: doc.updatedAt ?? new Date(),
          ...(doc as Partial<SessionDoc>),
        }
        docs.set(full._id.toString(), full)
        return full
      },
      findOneAndUpdate: async (filter: Document, update: Document) => {
        for (const doc of docs.values()) {
          if (!matches(doc, filter)) continue
          if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
          if (update.$inc) {
            for (const [key, amount] of Object.entries(update.$inc as Record<string, number>)) {
              const current = (doc as unknown as Record<string, unknown>)[key] as number
              ;(doc as unknown as Record<string, unknown>)[key] = current + amount
            }
          }
          return doc
        }
        return null
      },
      updateOne: async (filter: Document, update: Document) => {
        for (const doc of docs.values()) {
          if (!matches(doc, filter)) continue
          if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
          return { modifiedCount: 1 }
        }
        return { modifiedCount: 0 }
      },
      updateMany: async (filter: Document, update: Document) => {
        let n = 0
        for (const doc of docs.values()) {
          if (!matches(doc, filter)) continue
          if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
          n++
        }
        return { modifiedCount: n }
      },
    }
  }
  return {
    Session: makeModel(),
    makeModel,
  }
})

vi.mock('@/lib/db', () => ({
  get Session() {
    return mocks.Session
  },
}))

const userId = new Types.ObjectId()

beforeEach(() => {
  mocks.Session = mocks.makeModel()
})

describe('sessions', () => {
  it('creates a session and bumps lastSeenAt', async () => {
    const doc = await createSession({ userId, provider: 'google', remember: true })
    expect(doc.status).toBe('active')
    expect(doc.tokenVersion).toBe(0)
    expect(doc.lastSeenAt).toBeInstanceOf(Date)
  })

  it('reuses an active session with the same fingerprint instead of inserting', async () => {
    const first = await createSession({
      userId,
      provider: 'google',
      remember: true,
      browser: 'chrome',
      os: 'windows',
      deviceType: 'desktop',
    })
    const second = await createSession({
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
    const doc = await createSession({ userId, provider: 'google', remember: true })
    const result = await rotateSession(doc._id.toString(), doc.tokenVersion, userId)
    expect(result.rotated).toBe(true)
    expect(result.currentVersion).toBe(1)
    expect(result.remember).toBe(true)
  })

  it('rotateSession reports miss for a stale version', async () => {
    const doc = await createSession({ userId, provider: 'google', remember: true })
    const result = await rotateSession(doc._id.toString(), 99, userId)
    expect(result.rotated).toBe(false)
    expect(result.currentVersion).toBe(0)
  })

  it('lists only active sessions for a user', async () => {
    const other = new Types.ObjectId()
    await createSession({ userId, provider: 'google', remember: true })
    await createSession({ userId: other, provider: 'google', remember: true })
    const list = await listActiveSessions(userId)
    expect(list).toHaveLength(1)
    expect(list[0].userId.toString()).toBe(userId.toString())
  })

  it('revokeSession flips status to revoked', async () => {
    const doc = await createSession({ userId, provider: 'google', remember: true })
    const ok = await revokeSession(doc._id.toString(), userId)
    expect(ok).toBe(true)
    const after = await mocks.Session.findOne({ _id: doc._id })
    expect(after?.status).toBe('revoked')
  })

  it('revokeAllSessions flips every session', async () => {
    await createSession({ userId, provider: 'google', remember: true })
    await createSession({ userId, provider: 'x', remember: true, browser: 'firefox' })
    await revokeAllSessions(userId, 'logged_out')
    const list = await listActiveSessions(userId)
    expect(list).toHaveLength(0)
  })

  it('reads tokenVersion and remember defaults', async () => {
    const doc = await createSession({ userId, provider: 'google', remember: true })
    expect(await getSessionTokenVersion(doc._id.toString())).toBe(0)
    expect(await getSessionRemember(doc._id.toString())).toBe(true)
  })
})
```

Note: `find()` returns a thenable so `await Session.find(...)` resolves to the array without a real mongoose Query.

- [ ] **Step 3: Run the sessions tests**

Run: `npx vitest run src/lib/sessions.test.ts`
Expected: 8 tests PASS.

- [ ] **Step 4: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/sessions.ts` or `src/lib/sessions.test.ts`. (Other files still error — later tasks.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sessions.ts src/lib/sessions.test.ts
git commit -m "refactor: migrate session helpers to mongoose"
```

---

### Task 3: guest-usage + firebase-user -> mongoose

**Files:**
- Rewrite: `src/lib/guest-usage.ts`
- Rewrite: `src/lib/firebase-user.ts`
- Rewrite: `src/lib/firebase-user.test.ts`

**Interfaces:**
- Consumes: `GuestUsage` model + `GuestUsageDoc` type, `User` model + `UserDoc` type from `@/lib/db` (Task 1).
- Produces: `getGuestUsage(guestId: string): Promise<number>`, `incrementGuestUsage(guestId: string): Promise<number>`; `resolveUserCascade(token: DecodedIdToken, provider: ProviderName, users?: Model<UserDoc>): Promise<UserDoc>` — signature kept for test DI.

- [ ] **Step 1: Rewrite `src/lib/guest-usage.ts`**

Replace the entire file:

```ts
import 'server-only'

import { GuestUsage } from '@/lib/db'

export async function getGuestUsage(guestId: string): Promise<number> {
  const record = await GuestUsage.findById(guestId)
  return record?.conversionsUsed ?? 0
}

export async function incrementGuestUsage(guestId: string): Promise<number> {
  const record = await GuestUsage.findOneAndUpdate(
    { _id: guestId },
    {
      $inc: { conversionsUsed: 1 },
      $setOnInsert: { _id: guestId },
    },
    { upsert: true, new: true }
  )
  return record?.conversionsUsed ?? 1
}
```

Note: with a custom String `_id`, mongoose strips `_id` from the upsert filter — `$setOnInsert: { _id: guestId }` is required. `updatedAt` is applied automatically by `timestamps: true`.

- [ ] **Step 2: Rewrite `src/lib/firebase-user.ts`**

Replace the entire file:

```ts
import 'server-only'

import type { Model } from 'mongoose'
import type { DecodedIdToken } from 'firebase-admin/auth'

import { User, type UserDoc } from '@/lib/db'

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
  users?: Model<UserDoc>
): Promise<UserDoc> {
  const model = users ?? User
  const now = new Date()
  const email = token.email ? token.email.toLowerCase().trim() : null

  const existing = await model.findOne({ uid: token.uid })
  if (existing) {
    return (
      (await model.findOneAndUpdate(
        { uid: token.uid },
        {
          $set: {
            email: token.email ?? existing.email,
            displayName: token.name ?? existing.displayName,
            photoURL: token.picture ?? existing.photoURL,
            lastLoginAt: now,
          },
          $addToSet: { providers: provider },
        },
        { new: true }
      )) ?? existing
    )
  }

  if (email && token.email_verified === true) {
    const emailMatch = await model.findOne({ email })
    if (emailMatch) {
      return (
        (await model.findOneAndUpdate(
          { _id: emailMatch._id },
          {
            $set: {
              uid: token.uid,
              displayName: token.name ?? emailMatch.displayName,
              photoURL: token.picture ?? emailMatch.photoURL,
              lastLoginAt: now,
            },
            $addToSet: { providers: provider },
          },
          { new: true }
        )) ?? emailMatch
      )
    }
  }

  return model.create({
    uid: token.uid,
    email: email ?? token.email ?? null,
    displayName: token.name ?? 'CrushSVG user',
    photoURL: token.picture ?? null,
    providers: [provider],
    conversionsUsed: 0,
    lastLoginAt: now,
  })
}
```

Note: `$set` no longer touches `createdAt`/`updatedAt` — `timestamps: true` sets them. `_id` is omitted from `create` — mongoose generates it.

- [ ] **Step 3: Rewrite `src/lib/firebase-user.test.ts`**

Replace the entire file:

```ts
import { describe, it, expect } from 'vitest'
import { Types, type Model } from 'mongoose'

import {
  providerIdToName,
  resolveUserCascade,
  type ProviderName,
} from '@/lib/firebase-user'
import { type UserDoc } from '@/lib/db'

type Token = {
  uid: string
  email?: string | null
  name?: string | null
  picture?: string | null
  email_verified?: boolean
}

function fakeUsers(): Model<UserDoc> {
  const docs: UserDoc[] = []
  return {
    findOne: async (filter: Record<string, unknown>) =>
      docs.find((d) =>
        filter.uid
          ? d.uid === filter.uid
          : filter.email === d.email
      ) ?? null,
    create: async (doc: Partial<UserDoc>) => {
      const now = new Date()
      const full: UserDoc = {
        _id: new Types.ObjectId(),
        uid: String(doc.uid ?? ''),
        email: (doc.email as string | null) ?? null,
        displayName: doc.displayName ?? 'CrushSVG user',
        photoURL: doc.photoURL ?? null,
        providers: doc.providers ?? [],
        conversionsUsed: doc.conversionsUsed ?? 0,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: doc.lastLoginAt ?? now,
      }
      docs.push(full)
      return full
    },
    findOneAndUpdate: async (filter: Record<string, unknown>, update: Record<string, unknown>) => {
      let doc = docs.find((d) => filter.uid === d.uid)
      if (!doc && filter.email) doc = docs.find((d) => filter.email === d.email)
      if (!doc && filter._id) doc = docs.find((d) => d._id.equals(filter._id as Types.ObjectId))
      if (!doc) return null
      const set = (update.$set ?? {}) as Record<string, unknown>
      const addRaw = (update.$addToSet as { providers?: unknown } | undefined)?.providers
      const add: string[] = Array.isArray(addRaw) ? addRaw : addRaw ? [addRaw as string] : []
      Object.assign(doc, set)
      for (const p of add) if (!doc.providers.includes(p)) doc.providers.push(p)
      return doc
    },
  } as unknown as Model<UserDoc>
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
      { uid: 'fb-new', email: 'SAME@x.com', name: 'B', email_verified: true } as never,
      'google' as ProviderName,
      users
    )
    expect(user.uid).toBe('fb-new')
    expect(user.providers).toContain('password')
    expect(user.providers).toContain('google')
  })

  it('does not bind an unverified email onto an existing user', async () => {
    const users = fakeUsers()
    await resolveUserCascade(
      { uid: 'fb-old', email: 'same@x.com', name: 'A' } as never,
      'password' as ProviderName,
      users
    )
    const user = await resolveUserCascade(
      { uid: 'fb-new', email: 'SAME@x.com', name: 'B', email_verified: false } as never,
      'google' as ProviderName,
      users
    )
    expect(user.uid).toBe('fb-new')
    expect(user.providers).toEqual(['google'])
    expect(user.providers).not.toContain('password')
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

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/guest-usage.ts src/lib/firebase-user.test.ts src/lib/sessions.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/guest-usage.ts src/lib/firebase-user.ts src/lib/firebase-user.test.ts
git commit -m "refactor: migrate guest-usage and firebase-user to mongoose"
```

---

### Task 4: Auth libs -> mongoose

**Files:**
- Rewrite: `src/lib/auth-helpers.ts`
- Rewrite: `src/lib/auth-middleware.ts`

**Interfaces:**
- Consumes: `Session` model, `User` model, `UserDoc` type from `@/lib/db`; `createSession` with new signature (Task 2).
- Produces: unchanged exports — `authPayload(user, sessionId?, tokenVersion?)`, `issueSession(request, user, provider, remember?)`, `auth(request)`, `isMethodExempt`, `isAllowedOrigin`, `invalidateSessionCache`, `AuthUser`.

- [ ] **Step 1: Rewrite `src/lib/auth-helpers.ts`**

Replace the entire file:

```ts
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
```

- [ ] **Step 2: Rewrite `src/lib/auth-middleware.ts`**

Replace the entire file:

```ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { Session } from '@/lib/db'
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
  if (!header?.toLowerCase().startsWith('bearer ')) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let decoded: DecodedAccessToken
  try {
    decoded = await verifyAccessToken(header.slice('bearer '.length))
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
      const session = await Session.findOne({ _id: decoded.jti })
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

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/auth-helpers.ts` or `src/lib/auth-middleware.ts` (`src/lib/auth.ts` is untouched — it only imports the `UserDoc` type which still exists).

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth-helpers.ts src/lib/auth-middleware.ts
git commit -m "refactor: migrate auth helpers and middleware to mongoose"
```

---

### Task 5: Auth routes -> mongoose (+ tests)

**Files:**
- Rewrite: `src/app/api/v1/auth/register/route.ts`
- Rewrite: `src/app/api/v1/auth/login/route.ts`
- Rewrite: `src/app/api/v1/auth/refresh/route.ts`
- Rewrite: `src/app/api/v1/auth/logout/route.ts`
- Rewrite: `src/app/api/v1/auth/logout-all/route.ts`
- Rewrite: `src/app/api/v1/auth/change-password/route.ts`
- Rewrite: `src/app/api/v1/auth/refresh/route.test.ts`
- Rewrite: `src/app/api/v1/auth/logout/route.test.ts`
- Rewrite: `src/app/api/v1/auth/logout-all/route.test.ts`

**Interfaces:**
- Consumes: `User` model, `Session` model from `@/lib/db`; session helpers with new signatures (Task 2); `issueSession` (Task 4).

- [ ] **Step 1: Rewrite `src/app/api/v1/auth/register/route.ts`**

Changes: drop `ObjectId` and `getUsersCollection` imports; `User.findOne({ email })`; `User.create({...})` without `_id`/`createdAt`/`updatedAt`. Full file:

```ts
import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/auth-validation'
import { User } from '@/lib/db'
import { hashPassword, generateToken, hashToken, VERIFY_TOKEN_MINUTES } from '@/lib/passwords'
import { sendVerificationEmail } from '@/lib/email'
import { successResponse, errorResponse, getOrigin } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:register', 3, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many registration attempts. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message = Object.values(first).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', message)
  }

  const email = parsed.data.email.toLowerCase().trim()

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return errorResponse(
      409,
      'account_already_exists',
      'An account with this email already exists. Please log in instead.'
    )
  }

  const password = await hashPassword(parsed.data.password)
  const token = generateToken()
  const now = Date.now()

  await User.create({
    uid: `email_${email}`,
    email,
    displayName: parsed.data.name,
    name: parsed.data.name,
    photoURL: null,
    providers: ['email'],
    linkedProviders: ['email'],
    password,
    isVerified: false,
    emailVerificationToken: hashToken(token),
    emailVerificationTokenExpire: now + VERIFY_TOKEN_MINUTES * 60 * 1000,
    conversionsUsed: 0,
    lastLoginAt: new Date(now),
  })

  const verifyUrl = `${getOrigin(request)}/api/v1/verification/email/verify/${token}`
  void sendVerificationEmail(email, verifyUrl).catch((e) => {
    console.error('Verification email failed to send:', e)
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Email verification for ${email}: ${verifyUrl}`)
  }

  return successResponse(
    { message: 'Registration successful. Please check your email to verify your account.' },
    201
  )
}
```

- [ ] **Step 2: Rewrite `src/app/api/v1/auth/login/route.ts`**

Changes: `User.findOne({ email })`; `User.updateOne({ _id: user._id }, { $set: { lastLoginAt: now }, $addToSet: { linkedProviders: 'email' } })` (drop `updatedAt` — auto). Full file:

```ts
import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/auth-validation'
import { User } from '@/lib/db'
import { verifyPassword } from '@/lib/passwords'
import { checkBruteForce, recordFailure, resetBruteForce } from '@/lib/brute-force'
import { issueSession } from '@/lib/auth-helpers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:login', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many login attempts. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const email = parsed.data.email.toLowerCase().trim()
  const rememberMe = (body as { rememberMe?: unknown })?.rememberMe === true

  const bf = checkBruteForce(request, `login:${email}`)
  if (bf.blocked) {
    return errorResponse(429, 'account_locked', 'Too many failed login attempts. Please wait before trying again.')
  }

  const user = await User.findOne({ email })
  if (!user) {
    recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Invalid email or password')
  }
  if (!user.password) {
    recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Invalid email or password')
  }
  const isMatch = await verifyPassword(parsed.data.password, user.password)
  if (!isMatch) {
    recordFailure(request, `login:${email}`)
    return errorResponse(401, 'invalid_credentials', 'Invalid email or password')
  }
  if (!user.isVerified) {
    return errorResponse(
      401,
      'email_not_verified',
      'Please verify your email before logging in. Check your inbox for the verification link.'
    )
  }

  resetBruteForce(request, `login:${email}`)
  const now = new Date()
  await User.updateOne(
    { _id: user._id },
    {
      $set: { lastLoginAt: now },
      $addToSet: { linkedProviders: 'email' },
    }
  )
  user.lastLoginAt = now
  user.linkedProviders = [...(user.linkedProviders ?? []), 'email']

  const { payload } = await issueSession(request, user, 'email', rememberMe)
  const res = successResponse({ ...payload }, 200)
  res.cookies.set(REFRESH_COOKIE_NAME, (payload.token as { refreshToken: string }).refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
  })
  return res
}
```

- [ ] **Step 3: Rewrite `src/app/api/v1/auth/refresh/route.ts`**

Changes: import `Session` + `User` from `@/lib/db`; drop `getSessionsCollection`/`getUsersCollection`; `rotateSession(decoded.jti, decoded.ver ?? 0, decoded.id)` (no ObjectId casts — string params); `Session.findOne({ _id: decoded.jti })`; `User.findById(decoded.id)`. Only the changed import line and the three call sites differ from the current file; keep everything else (rate limit, cookie handling, response shapes) identical:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { rotateSession } from '@/lib/sessions'
import { buildTokenPayload, verifyRefreshToken } from '@/lib/tokens'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { Session, User } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:refresh', 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        version: '1.0.0',
        payload: { error: { code: 'rate_limited' } },
        serverTimestamp: new Date().toISOString(),
        retryAfterSeconds: rl.retryAfterSeconds,
      },
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

    const result = await rotateSession(decoded.jti, decoded.ver ?? 0, decoded.id)

    if (!result.rotated) {
      const current = await Session.findOne({ _id: decoded.jti })
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

    const user = await User.findById(decoded.id)
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

- [ ] **Step 4: Rewrite `src/app/api/v1/auth/logout/route.ts`**

Changes: drop `getSessionsCollection`; `revokeSession(who.user.jti, who.user.id)`. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { revokeSession } from '@/lib/sessions'
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
    if (who.user.jti) {
      await revokeSession(who.user.jti, who.user.id)
      invalidateSessionCache(who.user.jti)
      publishLogout(who.user.id)
    }
  }
  return res
}
```

- [ ] **Step 5: Rewrite `src/app/api/v1/auth/logout-all/route.ts`**

Changes: drop `getSessionsCollection`; `revokeAllSessions(who.user.id, 'logged_out')`. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  await revokeAllSessions(who.user.id, 'logged_out')
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

- [ ] **Step 6: Rewrite `src/app/api/v1/auth/change-password/route.ts`**

Changes: `User.findById(who.user.id)`; `User.updateOne({ _id: user._id }, { $set: { password: newHash }, $unset: { resetPasswordToken: '', resetPasswordTokenExpire: '' } })` (drop `updatedAt`); `revokeAllSessions(user._id, 'revoked')` (ObjectId accepted). Full file:

```ts
import { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { changePasswordSchema } from '@/lib/auth-validation'
import { User } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/passwords'
import { revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'
import { successResponse, errorResponse } from '@/lib/api-response'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('auth:change-password', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const user = await User.findById(who.user.id)
  if (!user) return errorResponse(404, 'user_not_found', 'User not found')
  if (!user.password) {
    return errorResponse(400, 'no_password', 'No password set. Use OAuth or forgot password instead.')
  }

  const isMatch = await verifyPassword(parsed.data.currentPassword, user.password)
  if (!isMatch) return errorResponse(401, 'invalid_credentials', 'Current password is incorrect')

  const isSamePassword = await verifyPassword(parsed.data.newPassword, user.password)
  if (isSamePassword) {
    return errorResponse(
      400,
      'same_password',
      'You are already using this password. Please choose a different password.'
    )
  }

  const newHash = await hashPassword(parsed.data.newPassword)
  await User.updateOne(
    { _id: user._id },
    {
      $set: { password: newHash },
      $unset: { resetPasswordToken: '', resetPasswordTokenExpire: '' },
    }
  )

  await revokeAllSessions(user._id, 'revoked')
  invalidateSessionCache()
  publishLogout(user._id.toString())

  const res = successResponse(
    { message: 'Password changed successfully. Please sign in again.' },
    200
  )
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
```

- [ ] **Step 7: Rewrite `src/app/api/v1/auth/refresh/route.test.ts`**

Changes: mock `@/lib/sessions` without `getSessionsCollection`; mock `@/lib/db` as `{ Session: { findOne: mocks.sessionFindOne }, User: { findById: mocks.usersFindById } }`; `rotateSession` expectation becomes `(SESSION_ID, 0, USER_ID)`; user lookup becomes `findById(USER_ID)`. Use `Types.ObjectId` from mongoose for doc `_id`/`userId` fields. Exact changes:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types } from 'mongoose'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyRefreshToken: vi.fn(),
  buildTokenPayload: vi.fn(),
  sessionFindOne: vi.fn(),
  rotateSession: vi.fn(),
  usersFindById: vi.fn(),
}))

vi.mock('@/lib/tokens', () => ({
  verifyRefreshToken: mocks.verifyRefreshToken,
  buildTokenPayload: mocks.buildTokenPayload,
}))
vi.mock('@/lib/sessions', () => ({
  rotateSession: mocks.rotateSession,
}))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh' }))
vi.mock('@/lib/db', () => ({
  Session: { findOne: mocks.sessionFindOne },
  User: { findById: mocks.usersFindById },
}))

import { POST } from './route'

const USER_ID = '507f1f77bcf86cd799439011'
const SESSION_ID = '507f1f77bcf86cd799439012'

function decodedRefresh(ver = 0) {
  return { id: USER_ID, jti: SESSION_ID, ver }
}

function fakeTokenPair() {
  return {
    tokenType: 'Bearer',
    accessToken: 'access-token',
    accessTokenExpires: '15m',
    refreshToken: 'refresh-token',
    refreshTokenExpires: '7d',
  }
}

function post(cookie?: string) {
  const headers = new Headers()
  if (cookie) headers.set('cookie', `crushsvg_refresh=${cookie}`)
  return POST(
    new NextRequest('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verifyRefreshToken.mockResolvedValue(decodedRefresh())
  mocks.buildTokenPayload.mockReturnValue(fakeTokenPair())
  mocks.sessionFindOne.mockResolvedValue(null)
  mocks.rotateSession.mockResolvedValue({ rotated: true, currentVersion: 1, remember: true })
  mocks.usersFindById.mockResolvedValue({ _id: new Types.ObjectId(USER_ID), uid: 'uid-1' })
})
```

The 10 test cases stay as-is except:
- success case expectation: `expect(mocks.rotateSession).toHaveBeenCalledWith(SESSION_ID, 0, USER_ID)`
- stale-version/revoked/missing/foreign session cases: `sessionFindOne` mock values use `new Types.ObjectId(...)` instead of `new ObjectId(...)`
- user_not_found case: `mocks.usersFindById.mockResolvedValue(null)`

- [ ] **Step 8: Rewrite `src/app/api/v1/auth/logout/route.test.ts`**

Changes: drop `getSessionsCollection` from hoisted mocks and the `@/lib/sessions` mock; delete `mocks.getSessionsCollection.mockResolvedValue(null)` from `beforeEach`; revocation expectation becomes `expect(mocks.revokeSession).toHaveBeenCalledWith(SESSION_ID, USER_ID)`. Delete `import { ObjectId } from 'mongodb'` — it is no longer referenced.

- [ ] **Step 9: Rewrite `src/app/api/v1/auth/logout-all/route.test.ts`**

Changes: drop `getSessionsCollection` from hoisted mocks and the `@/lib/sessions` mock; delete `mocks.getSessionsCollection.mockResolvedValue(null)` from `beforeEach`; expectation becomes `expect(mocks.revokeAllSessions).toHaveBeenCalledWith(USER_ID, 'logged_out')`. Delete `import { ObjectId } from 'mongodb'` — it is no longer referenced.

- [ ] **Step 10: Run the auth route tests**

Run: `npx vitest run src/app/api/v1/auth`
Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
git add src/app/api/v1/auth
git commit -m "refactor: migrate auth routes to mongoose"
```

---

### Task 6: Sessions, me, profile, usage, admin, conversions routes (+ tests)

**Files:**
- Rewrite: `src/app/api/v1/sessions/route.ts`
- Rewrite: `src/app/api/v1/sessions/[id]/route.ts`
- Rewrite: `src/app/api/me/route.ts`
- Rewrite: `src/app/api/v1/profile/route.ts`
- Rewrite: `src/app/api/v1/usage/route.ts`
- Rewrite: `src/app/api/v1/admin/users/route.ts`
- Rewrite: `src/app/api/v1/conversions/route.ts`
- Rewrite: `src/app/api/me/route.test.ts`
- Rewrite: `src/app/api/v1/sessions/route.test.ts`
- Rewrite: `src/app/api/v1/sessions/[id]/route.test.ts`

**Interfaces:**
- Consumes: `User`, `Session` models from `@/lib/db`; `listActiveSessions`, `revokeAllSessions`, `revokeSession` new signatures (Task 2); `getGuestUsage`, `incrementGuestUsage` (Task 3).

- [ ] **Step 1: Rewrite `src/app/api/v1/sessions/route.ts`**

Changes: import `listActiveSessions`, `revokeAllSessions` only; `listActiveSessions(who.user.id)`; `revokeAllSessions(who.user.id, 'revoked')`. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { listActiveSessions, revokeAllSessions } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const docs = await listActiveSessions(who.user.id)
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

  await revokeAllSessions(who.user.id, 'revoked')
  invalidateSessionCache()
  publishLogout(who.user.id)

  const res = new NextResponse(null, { status: 204 })
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
```

- [ ] **Step 2: Rewrite `src/app/api/v1/sessions/[id]/route.ts`**

Changes: `isValidObjectId` from mongoose instead of `ObjectId.isValid`; `revokeSession(id, who.user.id)`. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { isValidObjectId } from 'mongoose'

import { auth, invalidateSessionCache } from '@/lib/auth-middleware'
import { REFRESH_COOKIE_NAME } from '@/lib/auth'
import { revokeSession } from '@/lib/sessions'
import { publishLogout } from '@/lib/session-broker'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const { id } = await params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const revoked = await revokeSession(id, who.user.id)
  if (!revoked) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  invalidateSessionCache(id)
  publishLogout(who.user.id)

  const res = new NextResponse(null, { status: 204 })
  if (who.user.jti === id) {
    res.cookies.delete(REFRESH_COOKIE_NAME)
  }
  return res
}
```

- [ ] **Step 3: Rewrite `src/app/api/me/route.ts`**

Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { User } from '@/lib/db'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const user = await User.findById(who.user.id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json({ user: toUserDTO(user) }, { status: 200 })
}
```

- [ ] **Step 4: Rewrite `src/app/api/v1/profile/route.ts`**

Changes: `User.findById(who.user.id)` (GET + DELETE); `User.findByIdAndUpdate(who.user.id, { $set: updateData }, { new: true })` (PATCH); `User.deleteOne({ _id: user._id })`; `revokeAllSessions(user._id, 'revoked')`. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { updateProfileSchema } from '@/lib/validation'
import { User } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('profile:get', 60, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  const user = await User.findById(who.user.id)

  if (!user) {
    return errorResponse(404, 'user_not_found', 'User not found')
  }

  return successResponse({ user: toUserDTO(user) })
}

export async function PATCH(request: NextRequest) {
  const rl = checkRateLimit('profile:update', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { displayName, name } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (displayName !== undefined) updateData.displayName = displayName
  if (name !== undefined) updateData.name = name

  const updated = await User.findByIdAndUpdate(
    who.user.id,
    { $set: updateData },
    { new: true }
  )

  if (!updated) {
    return errorResponse(404, 'user_not_found', 'User not found')
  }

  return successResponse({ user: toUserDTO(updated) })
}

export async function DELETE(request: NextRequest) {
  const rl = checkRateLimit('profile:delete', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const { password } = body as { password?: string }
  if (!password) {
    return errorResponse(400, 'validation_error', 'Password is required to delete account')
  }

  const user = await User.findById(who.user.id)

  if (!user || !user.password) {
    return errorResponse(400, 'invalid_operation', 'Cannot delete OAuth-only account via this endpoint')
  }

  const { verifyPassword } = await import('@/lib/passwords')
  const isMatch = await verifyPassword(password, user.password)
  if (!isMatch) {
    return errorResponse(401, 'invalid_credentials', 'Password is incorrect')
  }

  await User.deleteOne({ _id: user._id })

  const { revokeAllSessions } = await import('@/lib/sessions')
  const { invalidateSessionCache } = await import('@/lib/auth-middleware')
  const { publishLogout } = await import('@/lib/session-broker')

  await revokeAllSessions(user._id, 'revoked')
  invalidateSessionCache()
  publishLogout(user._id.toString())

  const res = successResponse({ message: 'Account deleted successfully' })
  const { REFRESH_COOKIE_NAME } = await import('@/lib/auth')
  res.cookies.delete(REFRESH_COOKIE_NAME)
  return res
}
```

- [ ] **Step 5: Rewrite `src/app/api/v1/usage/route.ts`**

Changes: import `User` instead of `getUsersCollection` + `ObjectId`; `User.findByIdAndUpdate(who.user.id, { $inc: { conversionsUsed: 1 } }, { new: true })` (POST); `User.findById(who.user.id)` (GET). Two call-site replacements; all other logic identical. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { trackUsageSchema } from '@/lib/validation'
import { User } from '@/lib/db'
import { getGuestUsage, incrementGuestUsage } from '@/lib/guest-usage'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

const GUEST_LIMIT = 3
const RATE_LIMIT_WINDOW = 60_000

function getGuestId(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return request.headers.get('cf-connecting-ip')
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('usage:track', 60, RATE_LIMIT_WINDOW)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many usage tracking requests. Try again later.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const parsed = trackUsageSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { guestId, isAuthenticated } = parsed.data

  if (isAuthenticated) {
    const who = await auth(request)
    if ('error' in who) return who.error

    const user = await User.findByIdAndUpdate(
      who.user.id,
      { $inc: { conversionsUsed: 1 } },
      { new: true }
    )

    if (!user) {
      return errorResponse(404, 'user_not_found', 'User not found')
    }

    return successResponse({
      conversionsUsed: user.conversionsUsed,
      remaining: Math.max(0, GUEST_LIMIT - user.conversionsUsed),
      isUnlimited: true,
    })
  }

  if (!guestId) {
    const clientIp = getGuestId(request)
    if (!clientIp) {
      return errorResponse(400, 'validation_error', 'Unable to identify client')
    }
    const usage = await incrementGuestUsage(clientIp)
    const remaining = Math.max(0, GUEST_LIMIT - usage)

    return successResponse({
      conversionsUsed: usage,
      remaining,
      isUnlimited: false,
      limitReached: usage >= GUEST_LIMIT,
    })
  }

  const usage = await getGuestUsage(guestId)
  const remaining = Math.max(0, GUEST_LIMIT - usage)

  return successResponse({
    conversionsUsed: usage,
    remaining,
    isUnlimited: false,
    limitReached: usage >= GUEST_LIMIT,
  })
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('usage:check', 120, RATE_LIMIT_WINDOW)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many usage check requests. Try again later.')
  }

  const authHeader = request.headers.get('authorization')
  const isAuthenticated = authHeader?.toLowerCase().startsWith('bearer ')

  if (isAuthenticated) {
    const who = await auth(request)
    if ('error' in who) return who.error

    const user = await User.findById(who.user.id)

    if (!user) {
      return errorResponse(404, 'user_not_found', 'User not found')
    }

    return successResponse({
      conversionsUsed: user.conversionsUsed,
      remaining: Math.max(0, GUEST_LIMIT - user.conversionsUsed),
      isUnlimited: true,
    })
  }

  const guestId = getGuestId(request)
  if (!guestId) {
    return errorResponse(400, 'validation_error', 'Unable to identify client')
  }

  const usage = await getGuestUsage(guestId)
  const remaining = Math.max(0, GUEST_LIMIT - usage)

  return successResponse({
    conversionsUsed: usage,
    remaining,
    isUnlimited: false,
    limitReached: usage >= GUEST_LIMIT,
  })
}
```

- [ ] **Step 6: Rewrite `src/app/api/v1/admin/users/route.ts`**

Changes: import `User` instead of `getUsersCollection` + `ObjectId`; `User.countDocuments(filter)`; `User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)`; `User.findOne({ email: ... })`; `User.create({...})` returns the doc directly. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { User } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { toUserDTO } from '@/lib/auth'

export const runtime = 'nodejs'

async function requireAdmin(who: { user: { id: string; role: string } } | { error: Response }): Promise<{ user: { id: string; role: string } } | { error: Response }> {
  if ('error' in who) return who
  if (who.user.role !== 'admin') {
    return { error: NextResponse.json({ error: { code: 'forbidden', message: 'Admin access required' } }, { status: 403 }) }
  }
  return who
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('admin:users:list', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  const adminCheck = await requireAdmin(who)
  if ('error' in adminCheck) return adminCheck.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit
  const search = searchParams.get('search')?.trim()

  const filter: Record<string, unknown> = {}
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { uid: { $regex: search, $options: 'i' } },
    ]
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])

  return successResponse({
    data: docs.map(toUserDTO),
    meta: {
      total,
      page,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('admin:users:create', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  const adminCheck = await requireAdmin(who)
  if ('error' in adminCheck) return adminCheck.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const { email, displayName, role = 'user' } = body as { email: string; displayName?: string; role?: string }

  if (!email || !email.includes('@')) {
    return errorResponse(400, 'validation_error', 'Valid email is required')
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return errorResponse(409, 'email_taken', 'Email already registered')
  }

  const created = await User.create({
    uid: `admin_${email}`,
    email: email.toLowerCase().trim(),
    displayName: displayName ?? email.split('@')[0],
    photoURL: null,
    providers: ['admin'],
    conversionsUsed: 0,
    lastLoginAt: new Date(),
  })

  return successResponse({ user: toUserDTO(created) }, 201)
}
```

- [ ] **Step 7: Rewrite `src/app/api/v1/conversions/route.ts`**

Changes: drop `ObjectId` and `getUsersCollection` imports; `User.findById(who.user.id)`. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { conversionHistoryQuerySchema } from '@/lib/validation'
import { User } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('conversions:history', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  if ('error' in who) return who.error

  const { searchParams } = new URL(request.url)
  const parsed = conversionHistoryQuerySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    sort: searchParams.get('sort'),
  })

  if (!parsed.success) {
    return errorResponse(400, 'validation_error', 'Invalid query parameters')
  }

  const { page, limit, sort } = parsed.data
  const skip = (page - 1) * limit
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort
  const sortOrder = sort.startsWith('-') ? -1 : 1

  const user = await User.findById(who.user.id)

  if (!user) {
    return errorResponse(404, 'user_not_found', 'User not found')
  }

  return successResponse({
    data: [],
    meta: {
      total: 0,
      page,
      per_page: limit,
      total_pages: 0,
      has_next: false,
      has_prev: page > 1,
    },
    links: {
      self: request.url,
      first: `${request.nextUrl.pathname}?page=1&limit=${limit}`,
      last: `${request.nextUrl.pathname}?page=1&limit=${limit}`,
    },
    message: 'Conversion history feature coming soon. Currently stores only conversion count.'
  })
}
```

- [ ] **Step 8: Rewrite `src/app/api/me/route.test.ts`**

Changes: mock `@/lib/db` as `{ User: { findById: mocks.userFindById } }`; drop `getUsersCollection` mock; `USER_DOC._id` uses `new Types.ObjectId(USER_ID)` from mongoose; assertion `expect(mocks.userFindById).toHaveBeenCalledWith(USER_ID)` replaces the `findOne` object assertion. Full file:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindById: vi.fn(),
  toUserDTO: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({ auth: mocks.auth }))
vi.mock('@/lib/db', () => ({ User: { findById: mocks.userFindById } }))
vi.mock('@/lib/auth', () => ({ toUserDTO: mocks.toUserDTO }))

import { GET } from './route'

const USER_ID = '507f1f77bcf86cd799439011'

const USER_DOC = {
  _id: new Types.ObjectId(USER_ID),
  uid: 'uid-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: 'https://example.com/a.png',
  providers: ['google'],
  conversionsUsed: 2,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: new Date('2026-01-02T00:00:00.000Z'),
}

const USER_DTO = {
  uid: 'uid-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: 'https://example.com/a.png',
  providers: ['google'],
  conversionsUsed: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-02T00:00:00.000Z',
}

function get() {
  return GET(
    new NextRequest('http://localhost/api/me', {
      method: 'GET',
      headers: { authorization: 'Bearer access-token' },
    })
  )
}

function okWho() {
  return { user: { id: USER_ID, role: 'free' } }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue(okWho())
  mocks.userFindById.mockResolvedValue(USER_DOC)
  mocks.toUserDTO.mockReturnValue(USER_DTO)
})

describe('GET /api/me', () => {
  it('passes through the auth error when the bearer token is rejected', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await get()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(mocks.userFindById).not.toHaveBeenCalled()
  })

  it('returns 404 when the authenticated user has no document', async () => {
    mocks.userFindById.mockResolvedValue(null)
    const res = await get()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })

  it('looks up the user by the authenticated id', async () => {
    await get()
    expect(mocks.userFindById).toHaveBeenCalledWith(USER_ID)
  })

  it('returns 200 with the user DTO', async () => {
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toEqual(USER_DTO)
    expect(mocks.toUserDTO).toHaveBeenCalledWith(USER_DOC)
  })
})
```

- [ ] **Step 9: Rewrite `src/app/api/v1/sessions/route.test.ts`**

Changes: drop `getSessionsCollection` from hoisted mocks and the `@/lib/sessions` mock; delete `mocks.getSessionsCollection.mockResolvedValue(null)` from `beforeEach`; `fakeSessionDoc` uses `new Types.ObjectId()` from mongoose; expectations: `listActiveSessions` called with `(USER_ID)`, `revokeAllSessions` called with `(USER_ID, 'revoked')`.

- [ ] **Step 10: Rewrite `src/app/api/v1/sessions/[id]/route.test.ts`**

Changes: drop `getSessionsCollection` from hoisted mocks and the `@/lib/sessions` mock; delete `mocks.getSessionsCollection.mockResolvedValue(null)` from `beforeEach`; expectation: `revokeSession` called with `(SESSION_ID, USER_ID)`.

- [ ] **Step 11: Run the route tests**

Run: `npx vitest run src/app/api/me src/app/api/v1/sessions`
Expected: all PASS.

- [ ] **Step 12: Verify types**

Run: `npx tsc --noEmit`
Expected: only `passwords/*`, `verification/*`, `oauth/*`, `health/*` may still error.

- [ ] **Step 13: Commit**

```bash
git add src/app/api/me src/app/api/v1/sessions src/app/api/v1/profile src/app/api/v1/usage src/app/api/v1/admin src/app/api/v1/conversions
git commit -m "refactor: migrate session, user and usage routes to mongoose"
```

---

### Task 7: Passwords, verification, oauth, health routes

**Files:**
- Rewrite: `src/app/api/v1/passwords/forgot/route.ts`
- Rewrite: `src/app/api/v1/passwords/reset/route.ts`
- Rewrite: `src/app/api/v1/verification/email/resend/route.ts`
- Rewrite: `src/app/api/v1/oauth/[[...slug]]/route.ts`
- Rewrite: `src/app/api/v1/health/route.ts`

**Interfaces:**
- Consumes: `User` model, `Session` model, `connectToDatabase()` from `@/lib/db`; `revokeAllSessions` (Task 2); `resolveUserCascade` (Task 3); `createSession` new signature (Task 2).

- [ ] **Step 1: Rewrite `src/app/api/v1/passwords/forgot/route.ts`**

Changes: `User.findOne({ email })`; `User.updateOne({ _id: user._id }, { $set: { resetPasswordToken: ..., resetPasswordTokenExpire: ... } })` (drop `updatedAt`). Only the import line and two call sites change; everything else identical. Replace `import { getUsersCollection } from '@/lib/db'` with `import { User } from '@/lib/db'`, delete the `const users = await getUsersCollection()` line, and rename `users.findOne({ email })` -> `User.findOne({ email })`, `users.updateOne(...)` -> `User.updateOne(...)`.

- [ ] **Step 2: Rewrite `src/app/api/v1/passwords/reset/route.ts`**

Changes: `User.findOne({...})` (GET + POST); `User.updateOne({...})` with `modifiedCount` check; `revokeAllSessions(user._id, 'revoked')`. Replace `import { getUsersCollection } from '@/lib/db'` with `import { User } from '@/lib/db'`; delete `const users = await getUsersCollection()` lines; rename `users.findOne` -> `User.findOne` (2 sites) and `users.updateOne` -> `User.updateOne`; replace `getSessionsCollection()` + `revokeAllSessions(sessions, user._id, 'revoked')` with `await revokeAllSessions(user._id, 'revoked')`; drop `import { getSessionsCollection } from '@/lib/sessions'`.

- [ ] **Step 3: Rewrite `src/app/api/v1/verification/email/resend/route.ts`**

Changes: `User.findOne({ email })`; `User.updateOne({ _id: user._id }, { $set: { emailVerificationToken: ..., emailVerificationTokenExpire: ... } })` (drop `updatedAt`). Replace `import { getUsersCollection } from '@/lib/db'` with `import { User } from '@/lib/db'`; delete `const users = await getUsersCollection()`; rename the two call sites.

- [ ] **Step 4: Rewrite `src/app/api/v1/oauth/[[...slug]]/route.ts`**

Changes: drop `getSessionsCollection` import; `createSession({ userId: user._id, ... })` without the collection arg. Replace `import { createSession, getSessionsCollection } from '@/lib/sessions'` with `import { createSession } from '@/lib/sessions'`; delete `const sessions = await getSessionsCollection()`; change `await createSession(sessions, {...})` to `await createSession({...})`.

- [ ] **Step 5: Rewrite `src/app/api/v1/health/route.ts`**

Changes: `connectToDatabase()` then ping via the underlying client — mongoose 9 does not expose `connection.db`; use `getClient()`:

```ts
import { NextRequest, NextResponse } from 'next/server'

import { connectToDatabase } from '@/lib/db'
import { successResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; latencyMs?: number }> = {}

  const dbStart = Date.now()
  try {
    const connection = await connectToDatabase()
    await connection.getClient().db().command({ ping: 1 })
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error) {
    checks.database = { status: 'error', message: (error as Error).message, latencyMs: Date.now() - dbStart }
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok')

  const response = {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    environment: process.env.NODE_ENV ?? 'development',
    checks,
  }

  return NextResponse.json(response, { status: allHealthy ? 200 : 503 })
}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors anywhere.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/v1/passwords src/app/api/v1/verification src/app/api/v1/oauth src/app/api/v1/health
git commit -m "refactor: migrate passwords, verification, oauth and health routes to mongoose"
```

---

### Task 8: Final verification gate

**Files:**
- None (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 4: Grep for leftover raw-driver imports**

Run: `Get-ChildItem -Recurse -Include *.ts -Path src | Select-String -Pattern "from 'mongodb'|getUsersCollection|getSessionsCollection|getGuestUsageCollection|getMongoClient"`
Expected: no matches. (`mongodb` remains only in `package.json`/`package-lock.json` as a peer dependency of mongoose.)

- [ ] **Step 5: Live connection check**

Run: `npm run dev` (or `npx next dev`) in a terminal, then:

```
Invoke-RestMethod http://localhost:3000/api/v1/health
```

Expected: `checks.database.status` = `ok`. Dev server log prints `Connected to MongoDB successfully`.

- [ ] **Step 6: Commit plan + spec**

```bash
git add docs/superpowers/plans/2026-08-13-mongoose-migration.md
git commit -m "docs: add mongoose migration implementation plan"
```
