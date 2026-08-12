import 'server-only'

import { cookies } from 'next/headers'
import type { DecodedIdToken } from 'firebase-admin/auth'

import { signInProvider, verifySessionCookie } from '@/lib/firebase-admin'
import { getUsersCollection, type UserDoc } from '@/lib/db'

export const SESSION_COOKIE_NAME = 'crushsvg_session'
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

export interface UserDTO {
  uid: string
  email: string | null
  displayName: string
  photoURL: string | null
  providers: string[]
  conversionsUsed: number
  createdAt: string
  lastLoginAt: string
}

export function toUserDTO(user: UserDoc): UserDTO {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providers: user.providers,
    conversionsUsed: user.conversionsUsed,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  }
}

export async function upsertUser(token: DecodedIdToken): Promise<UserDoc> {
  const users = await getUsersCollection()
  const now = new Date()
  const provider = signInProvider(token)
  const email = token.email ?? null

  const user = await users.findOneAndUpdate(
    { uid: token.uid },
    {
      $set: {
        email,
        displayName: token.name ?? 'CrushSVG user',
        photoURL: token.picture ?? null,
        updatedAt: now,
        lastLoginAt: now,
      },
      $setOnInsert: {
        conversionsUsed: 0,
        createdAt: now,
      },
      $addToSet: { providers: provider },
    },
    { upsert: true, returnDocument: 'after' }
  )

  if (!user) {
    throw new Error('Failed to upsert user')
  }

  return user
}

export async function setSessionCookie(sessionCookie: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_COOKIE_MAX_AGE_MS / 1000),
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionUser(): Promise<UserDoc | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!session) return null

  let token: DecodedIdToken
  try {
    token = await verifySessionCookie(session)
  } catch {
    return null
  }

  const users = await getUsersCollection()
  return users.findOne({ uid: token.uid })
}
