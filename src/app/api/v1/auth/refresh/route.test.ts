import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types } from 'mongoose'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyRefreshToken: vi.fn(),
  buildTokenPayload: vi.fn(),
  sessionFindOne: vi.fn(),
  rotateSession: vi.fn(),
  sessionRotatedWithin: vi.fn(),
  usersFindById: vi.fn(),
}))

vi.mock('@/lib/tokens', () => ({
  verifyRefreshToken: mocks.verifyRefreshToken,
  buildTokenPayload: mocks.buildTokenPayload,
}))
vi.mock('@/lib/sessions', () => ({
  rotateSession: mocks.rotateSession,
  wasSessionRotatedWithin: mocks.sessionRotatedWithin,
}))
vi.mock('@/lib/auth', () => ({
  REFRESH_COOKIE_NAME: 'crushsvg_refresh',
  toUserDTO: (user: unknown) => ({ uid: 'uid-1', email: 'a@b.com', displayName: 'Test', name: 'Test', photoURL: null, providers: ['email'], linkedProviders: ['email'], role: 'user', hasPassword: true, isVerified: true, conversionsUsed: 0, createdAt: '', lastLoginAt: '' }),
}))
vi.mock('@/lib/db', () => ({
  Session: { findOne: mocks.sessionFindOne, updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }) },
  User: { findById: mocks.usersFindById },
}))

import { POST } from './route'

const USER_ID = '507f1f77bcf86cd799439011'
const SESSION_ID = '507f1f77bcf86cd799439012'

function decodedRefresh(ver = 0) {
  return { id: USER_ID, jti: SESSION_ID, ver }
}

function fakeTokenPair() {
  return {
    tokenType: 'Bearer',
    accessToken: 'access-token',
    accessTokenExpires: '15m',
    refreshToken: 'refresh-token',
    refreshTokenExpires: '7d',
  }
}

function post(cookie?: string) {
  const headers = new Headers()
  if (cookie) headers.set('cookie', `crushsvg_refresh=${cookie}`)
  return POST(
    new NextRequest('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verifyRefreshToken.mockResolvedValue(decodedRefresh())
  mocks.buildTokenPayload.mockReturnValue(fakeTokenPair())
  mocks.sessionFindOne.mockResolvedValue(null)
  mocks.rotateSession.mockResolvedValue({ rotated: true, currentVersion: 1, remember: true })
  mocks.sessionRotatedWithin.mockResolvedValue(false)
  mocks.usersFindById.mockResolvedValue({ _id: new Types.ObjectId(USER_ID), uid: 'uid-1', role: 'user' })
})

describe('POST /api/v1/auth/refresh', () => {
  it('returns 200 token_missing when cookie absent', async () => {
    const res = await post()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.version).toBe('1.0.0')
    expect(body.payload.error.code).toBe('token_missing')
    expect(typeof body.serverTimestamp).toBe('string')
    expect(mocks.verifyRefreshToken).not.toHaveBeenCalled()
  })

  it('returns 200 token_invalid and deletes cookie when token verification fails', async () => {
    mocks.verifyRefreshToken.mockRejectedValue(new Error('bad token'))
    const res = await post('garbage')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.payload.error.code).toBe('token_invalid')
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('rotates the session and reissues tokens on success', async () => {
    const res = await post('valid-refresh')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.payload.token).toEqual(fakeTokenPair())
    expect(mocks.rotateSession).toHaveBeenCalledWith(SESSION_ID, 0, USER_ID)
    expect(mocks.buildTokenPayload).toHaveBeenCalledWith({
      id: USER_ID,
      role: 'user',
      sessionId: SESSION_ID,
      tokenVersion: 1,
    })
    const cookie = res.cookies.get('crushsvg_refresh')
    expect(cookie?.value).toBe('refresh-token')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.maxAge).toBe(7 * 24 * 60 * 60)
  })

  it('revokes the session and returns 401 when rotation fails on a stale version (token reuse)', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 2, remember: false })
    mocks.sessionFindOne.mockResolvedValue({
      _id: new Types.ObjectId(SESSION_ID),
      userId: new Types.ObjectId(USER_ID),
      status: 'active',
    })
    const res = await post('stale-refresh')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.payload.error.code).toBe('session_revoked')
    expect(res.cookies.get('crushsvg_refresh')?.value).toBe('')
    expect(mocks.buildTokenPayload).not.toHaveBeenCalled()
  })

  it('reissues tokens at the current version when the mismatch is a recent race (rapid reload)', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 2, remember: true })
    mocks.sessionRotatedWithin.mockResolvedValue(true)
    const res = await post('racing-refresh')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mocks.buildTokenPayload).toHaveBeenCalledWith({
      id: USER_ID,
      role: 'user',
      sessionId: SESSION_ID,
      tokenVersion: 2,
    })
    expect(res.cookies.get('crushsvg_refresh')?.value).toBe('refresh-token')
  })

  it('still revokes when the stale version race is older than the grace window', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 2, remember: false })
    mocks.sessionRotatedWithin.mockResolvedValue(false)
    const res = await post('stale-refresh')
    expect(res.status).toBe(401)
    expect((await res.json()).payload.error.code).toBe('session_revoked')
    expect(mocks.buildTokenPayload).not.toHaveBeenCalled()
  })

  it('does not set maxAge when session remember is false', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: true, currentVersion: 1, remember: false })
    const res = await post('valid-refresh')
    expect(res.status).toBe(200)
    expect(res.cookies.get('crushsvg_refresh')?.maxAge).toBeUndefined()
  })

  it('returns 401 session_revoked and deletes cookie when session revoked', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 0, remember: true })
    mocks.sessionFindOne.mockResolvedValue({
      _id: new Types.ObjectId(SESSION_ID),
      userId: new Types.ObjectId(USER_ID),
      status: 'revoked',
    })
    const res = await post('revoked-refresh')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.payload.error.code).toBe('session_revoked')
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('returns 401 session_revoked and deletes cookie when session missing', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 0, remember: true })
    const res = await post('missing-refresh')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.payload.error.code).toBe('session_revoked')
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('returns 401 session_revoked when session belongs to another user', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 0, remember: true })
    mocks.sessionFindOne.mockResolvedValue({
      _id: new Types.ObjectId(SESSION_ID),
      userId: new Types.ObjectId('507f1f77bcf86cd799439099'),
      status: 'active',
    })
    const res = await post('foreign-refresh')
    expect(res.status).toBe(401)
    expect((await res.json()).payload.error.code).toBe('session_revoked')
  })

  it('returns 401 user_not_found and deletes cookie when user missing', async () => {
    mocks.usersFindById.mockResolvedValue(null)
    const res = await post('valid-refresh')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.payload.error.code).toBe('user_not_found')
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('returns 429 rate_limited after 120 requests within the window', async () => {
    let res: Response | undefined
    for (let i = 0; i < 150; i++) {
      const r = await post()
      if (r.status === 429) {
        res = r
        break
      }
      expect(r.status).toBe(200)
    }
    expect(res).toBeDefined()
    const body = await (res as Response).json()
    expect(body.success).toBe(false)
    expect(body.version).toBe('1.0.0')
    expect(typeof body.serverTimestamp).toBe('string')
    expect(body.payload.error.code).toBe('rate_limited')
    expect(body.retryAfterSeconds).toBeGreaterThan(0)
  })
})
