### Task 3: Sessions collection + ops (`src/lib/sessions.ts`)

**Files:**
- Create: `src/lib/sessions.ts`
- Test: `src/lib/sessions.test.ts`

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

Run: `npm test -- src/lib/sessions.test.ts`
Expected: FAIL — `@/lib/sessions` not found.

- [ ] **Step 3: Write src/lib/sessions.ts**

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

Run: `npm test -- src/lib/sessions.test.ts`
Expected: all tests PASS. (The fake `findOneAndUpdate` returns `undefined` value — `rotateSession` treats it as miss and falls back to `findOne`; adjust the fake if the fallback path is exercised differently.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sessions.ts src/lib/sessions.test.ts
git commit -m "feat: sessions collection with fingerprint reuse and rotation"
```

---

