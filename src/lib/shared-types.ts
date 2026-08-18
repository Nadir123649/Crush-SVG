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

export interface UsageInfo {
  conversionsUsed: number
  remaining: number
  isUnlimited: boolean
  limitReached?: boolean
}
