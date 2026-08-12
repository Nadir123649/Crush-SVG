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

function matches(doc: SessionDoc, filter: Document): boolean {
  return Object.entries(filter).every(([key, value]) => {
    const actual = (doc as unknown as Record<string, unknown>)[key]
    if (actual === undefined || value === undefined) return actual === value
    return String(actual) === String(value)
  })
}

function fakeCollection(): Collection<SessionDoc> {
  const docs = new Map<string, SessionDoc>()
  return {
    findOne: async (filter: Document) => {
      for (const doc of docs.values()) {
        if (matches(doc, filter)) return doc
      }
      return null
    },
    find: (filter: Document) => ({
      sort: () => ({
        toArray: async () =>
          [...docs.values()].filter((d) => matches(d, filter)),
      }),
    }),
    insertOne: async (doc: SessionDoc) => {
      docs.set(doc._id.toString(), doc)
      return { insertedId: doc._id } as never
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
        return { modifiedCount: 1 } as never
      }
      return { modifiedCount: 0 } as never
    },
    updateMany: async (filter: Document, update: Document) => {
      let n = 0
      for (const doc of docs.values()) {
        if (!matches(doc, filter)) continue
        if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
        n++
      }
      return { modifiedCount: n } as never
    },
    createIndex: async () => '',
  } as unknown as Collection<SessionDoc>
}

const userId = new ObjectId()

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
