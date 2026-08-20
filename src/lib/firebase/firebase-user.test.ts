import { describe, it, expect } from 'vitest'
import { Types, type Model } from 'mongoose'

import {
  providerIdToName,
  resolveUserCascade,
  type ProviderName,
} from '@/lib/firebase/firebase-user'
import { type UserDoc } from '@/lib/database/db'

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
        role: doc.role ?? 'user',
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

  it('creates a separate account when a verified OAuth email matches an existing password account', async () => {
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
    expect(user.providers).toEqual(['google'])
    const emailAccount = await users.findOne({ email: 'same@x.com' })
    expect(emailAccount?.providers).toEqual(['password'])
  })

  it('does not verify the password account or the OAuth account when emails match', async () => {
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
    expect(user.isVerified).toBeUndefined()
    const emailAccount = await users.findOne({ email: 'same@x.com' })
    expect(emailAccount?.isVerified).toBeUndefined()
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

  it('reuses the same account for repeat logins with the same provider uid', async () => {
    const users = fakeUsers()
    await resolveUserCascade(
      { uid: 'fb-old', email: 'same@x.com', name: 'A' } as never,
      'password' as ProviderName,
      users
    )
    const token = { uid: 'fb-1', email: 'same@x.com', name: 'C' } as never
    await resolveUserCascade(token, 'google' as ProviderName, users)
    const again = await resolveUserCascade(token, 'google' as ProviderName, users)
    expect(again.uid).toBe('fb-1')
    expect(again.providers.filter((p) => p === 'google')).toHaveLength(1)
  })
})
