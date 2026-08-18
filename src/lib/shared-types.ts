export interface UserDTO {
  uid: string
  email: string | null
  displayName: string
  name: string | null
  photoURL: string | null
  providers: string[]
  linkedProviders: string[]
  role: 'user' | 'admin'
  hasPassword: boolean
  isVerified: boolean
  conversionsUsed: number
  createdAt: string
  lastLoginAt: string
}

export interface TokenPairDTO {
  tokenType: 'Bearer'
  accessToken: string
  accessTokenExpires: string
  refreshToken: string
  refreshTokenExpires: string
}

export interface SessionDTO {
  id: string
  provider: string
  browser?: string
  os?: string
  deviceType?: string
  ip?: string
  location?: string
  remember: boolean
  createdAt: string
  lastSeenAt: string
  status: string
}

export interface UsageInfo {
  conversionsUsed: number
  remaining: number
  isUnlimited: boolean
  limitReached?: boolean
}
