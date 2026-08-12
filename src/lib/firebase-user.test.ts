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
      if (!doc && filter._id) doc = docs.find((d) => d._id.equals(filter._id))
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
        return doc
      }
      const set = (update.$set ?? {}) as Record<string, unknown>
      const addRaw = update.$addToSet?.providers
      const add: string[] = Array.isArray(addRaw) ? addRaw : addRaw ? [addRaw] : []
      Object.assign(doc, set)
      for (const p of add) if (!doc.providers.includes(p)) doc.providers.push(p)
      return doc
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