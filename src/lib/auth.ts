import 'server-only'

import type { NextRequest } from 'next/server'
import type { UserDoc } from '@/lib/db'

import { auth } from '@/lib/auth-middleware'
import { getUsersCollection } from '@/lib/db'

export const REFRESH_COOKIE_NAME = 'crushsvg_refresh'

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

export async function getSessionUser(request: NextRequest): Promise<UserDoc | null> {
  const who = await auth(request)
  if ('error' in who) return null
  const users = await getUsersCollection()
  return users.findOne({ _id: new (await import('mongodb')).ObjectId(who.user.id) })
}
