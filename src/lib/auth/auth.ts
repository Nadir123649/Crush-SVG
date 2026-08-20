import 'server-only'

import type { UserDoc } from '@/lib/database/db'
import type { UserDTO } from '@/lib/shared/shared-types'

export const REFRESH_COOKIE_NAME = 'crushsvg_refresh'

export type { UserDTO, TokenPairDTO, UsageInfo } from '@/lib/shared/shared-types'

export function toUserDTO(user: UserDoc): UserDTO {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    name: user.name ?? user.displayName,
    photoURL: user.photoURL,
    providers: user.providers,
    linkedProviders: user.linkedProviders ?? user.providers,
    role: user.role ?? 'user',
    hasPassword: !!user.password,
    isVerified: user.isVerified ?? false,
    conversionsUsed: user.conversionsUsed,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  }
}
