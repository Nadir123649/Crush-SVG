### Task 6: User cascade (`src/lib/firebase-user.ts`)

**Files:**
- Create: `src/lib/firebase-user.ts`
- Test: `src/lib/firebase-user.test.ts`

**Interfaces:**
- Consumes: `type DecodedIdToken` from `firebase-admin/auth`; `getUsersCollection`, `type UserDoc` from `@/lib/db`
- Produces:
  - `type ProviderName = 'google' | 'github' | 'x' | 'password'`
  - `providerIdToName(providerId: string): ProviderName` — map `google.com/github.com/twitter.com/password`, fallback returns providerId as-is
  - `resolveUserCascade(token: DecodedIdToken, provider: ProviderName, users?: Collection<UserDoc>): Promise<UserDoc>` — cascade: `uid` match → `email` match (bind provider, backfill photoURL/displayName) → create; always `$addToSet` provider, refresh profile, bump `lastLoginAt`/`updatedAt`
  - Delete `signInProvider` from `src/lib/firebase-admin.ts` (its only consumer `src/lib/auth.ts` is rewritten in Task 10)

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

Run: `npm test -- src/lib/firebase-user.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/lib/firebase-user.ts**

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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/firebase-user.test.ts`
Expected: 4 tests PASS.

(Note: `signInProvider` in `src/lib/firebase-admin.ts` is removed in Task 10, not here — `src/lib/auth.ts` still imports it until Task 8.)

---

