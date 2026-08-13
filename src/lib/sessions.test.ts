import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types } from 'mongoose'

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
    const matches = (doc: SessionDoc, filter: Record<string, unknown>): boolean =>
      Object.entries(filter).every(([key, value]) => {
        const actual = (doc as unknown as Record<string, unknown>)[key]
        if (actual === undefined || value === undefined) return actual === value
        return String(actual) === String(value)
      })
    return {
      findOne: async (filter: Record<string, unknown>) => {
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
      find: (filter: Record<string, unknown>) => {
        const matched = [...docs.values()].filter((d) => matches(d, filter))
        return {
          sort: () => ({
            skip: () => ({
              limit: () => ({
                then: (resolve: (v: SessionDoc[]) => void) => resolve(matched),
              }),
            }),
          }),
        }
      },
      countDocuments: async (filter: Record<string, unknown>) =>
        [...docs.values()].filter((d) => matches(d, filter)).length,
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
      findOneAndUpdate: async (filter: Record<string, unknown>, update: Record<string, unknown>) => {
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
      updateOne: async (filter: Record<string, unknown>, update: Record<string, unknown>) => {
        for (const doc of docs.values()) {
          if (!matches(doc, filter)) continue
          if (update.$set) Object.assign(doc, update.$set as Record<string, unknown>)
          return { modifiedCount: 1 }
        }
        return { modifiedCount: 0 }
      },
      updateMany: async (filter: Record<string, unknown>, update: Record<string, unknown>) => {
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
    expect(list.docs).toHaveLength(1)
    expect(list.docs[0].userId.toString()).toBe(userId.toString())
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
    expect(list.docs).toHaveLength(0)
  })

  it('reads tokenVersion and remember defaults', async () => {
    const doc = await createSession({ userId, provider: 'google', remember: true })
    expect(await getSessionTokenVersion(doc._id.toString())).toBe(0)
    expect(await getSessionRemember(doc._id.toString())).toBe(true)
  })
})
