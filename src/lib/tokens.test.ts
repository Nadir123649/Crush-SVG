import { describe, it, expect, beforeAll, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  buildTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/tokens'

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
})

describe('tokens', () => {
  it('verifies an access token and round-trips claims', async () => {
    const token = generateAccessToken({ id: 'user-1', role: 'free', sessionId: 'sess-1' })
    const decoded = await verifyAccessToken(token)
    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe('free')
    expect(decoded.jti).toBe('sess-1')
  })

  it('verifies a refresh token with version claim', async () => {
    const token = generateRefreshToken({ id: 'user-1', sessionId: 'sess-1', tokenVersion: 3 })
    const decoded = await verifyRefreshToken(token)
    expect(decoded.id).toBe('user-1')
    expect(decoded.jti).toBe('sess-1')
    expect(decoded.ver).toBe(3)
  })

  it('rejects tokens signed with the wrong secret', async () => {
    const token = generateAccessToken({ id: 'user-1', role: 'free' })
    process.env.JWT_ACCESS_SECRET = 'different-secret'
    await expect(verifyAccessToken(token)).rejects.toThrow()
    process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  })

  it('buildTokenPayload returns 4 token fields', () => {
    const pair = buildTokenPayload({ id: 'user-1', role: 'free', sessionId: 'sess-1', tokenVersion: 1 })
    expect(pair.tokenType).toBe('Bearer')
    expect(typeof pair.accessToken).toBe('string')
    expect(pair.accessTokenExpires).toBe('15m')
    expect(typeof pair.refreshToken).toBe('string')
    expect(pair.refreshTokenExpires).toBe('7d')
  })
})
