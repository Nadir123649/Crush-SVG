import 'server-only'

import type { UserDoc } from '@/lib/db'

export const REFRESH_COOKIE_NAME = 'crushsvg_refresh'

export interface UserDTO {
  uid: string
  email: string | null
  displayName: string
  name: string | null
  photoURL: string | null
  providers: string[]
  linkedProviders: string[]
  hasPassword: boolean
  isVerified: boolean
  conversionsUsed: number
  createdAt: string
  lastLoginAt: string
}

export function toUserDTO(user: UserDoc): UserDTO {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    name: user.name ?? user.displayName,
    photoURL: user.photoURL,
    providers: user.providers,
    linkedProviders: user.linkedProviders ?? user.providers,
    hasPassword: !!user.password,
    isVerified: user.isVerified ?? false,
    conversionsUsed: user.conversionsUsed,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  }
}
