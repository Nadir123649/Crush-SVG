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
