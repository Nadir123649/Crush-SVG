import 'server-only'

import { ObjectId, type Collection } from 'mongodb'
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

  if (email && token.email_verified === true) {
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
    _id: new ObjectId(),
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
