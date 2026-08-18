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
 * Resolves an OAuth identity to a CrushSVG account.
 *
 * Accounts are NOT merged across providers: a Google account and an email
 * (password) account may share the same email address and operate as two
 * completely separate accounts.
 *  1. Match by provider `uid` (the provider's canonical identity) — this is
 *     the only path that reuses an existing account, so re-logging in with the
 *     same Google account returns the same account.
 *  2. Otherwise create a brand-new account, even if a password (or other
 *     OAuth) account already exists for the same email.
 *  3. Duplicate-key races are caught and re-resolved so no second account for
 *     the same provider uid is ever created.
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
      const existing = await model.findOne({ uid: token.uid })
      if (existing) return existing
    }
    throw error
  }
}