import 'server-only'

import type { Model } from 'mongoose'
import type { DecodedIdToken } from 'firebase-admin/auth'

import { User, type UserDoc, isDuplicateKeyError } from '@/lib/db'
import { isAdminEmail } from '@/lib/roles'

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

function roleFor(email: string | null | undefined): 'user' | 'admin' {
  return isAdminEmail(email) ? 'admin' : 'user'
}

/**
 * Resolves an OAuth identity to a single CrushSVG account.
 *
 * Guarantees one-account-per-email across all providers:
 *  1. Match by provider `uid` (the provider's canonical identity) and link.
 *  2. Otherwise, when the incoming identity can PROVE ownership of the email
 *     (verified OAuth email), link onto the existing account. The first
 *     established `uid` is preserved — it is never overwritten.
 *  3. Otherwise create a brand-new account.
 *  4. Duplicate-key races are caught and re-resolved so no second account for
 *     the same email/uid is ever created.
 */
export async function resolveUserCascade(
  token: DecodedIdToken,
  provider: ProviderName,
  users?: Model<UserDoc>
): Promise<UserDoc> {
  const model = users ?? User
  const now = new Date()
  const email = token.email ? token.email.toLowerCase().trim() : null

  const byUid = await model.findOne({ uid: token.uid })
  if (byUid) {
    return (
      (await model.findOneAndUpdate(
        { uid: token.uid },
        {
          $set: {
            email: email ?? byUid.email,
            displayName: token.name ?? byUid.displayName,
            photoURL: token.picture ?? byUid.photoURL,
            lastLoginAt: now,
          },
          $addToSet: { providers: provider, linkedProviders: provider },
        },
        { new: true }
      )) ?? byUid
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
              displayName: token.name ?? emailMatch.displayName,
              photoURL: token.picture ?? emailMatch.photoURL,
              lastLoginAt: now,
            },
            $addToSet: { providers: provider, linkedProviders: provider },
          },
          { new: true }
        )) ?? emailMatch
      )
    }
  }

  try {
    return await model.create({
      uid: token.uid,
      email: email ?? token.email ?? null,
      displayName: token.name ?? 'CrushSVG user',
      photoURL: token.picture ?? null,
      providers: [provider],
      linkedProviders: [provider],
      role: roleFor(email),
      conversionsUsed: 0,
      lastLoginAt: now,
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await model.findOne({
        $or: [{ uid: token.uid }, ...(email ? [{ email }] : [])],
      })
      if (existing) return existing
    }
    throw error
  }
}