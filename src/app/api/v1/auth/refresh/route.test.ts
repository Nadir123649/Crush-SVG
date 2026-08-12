import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyRefreshToken: vi.fn(),
  buildTokenPayload: vi.fn(),
  getSessionsCollection: vi.fn(),
  sessionFindOne: vi.fn(),
  rotateSession: vi.fn(),
  getUsersCollection: vi.fn(),
  usersFindOne: vi.fn(),
}))

vi.mock('@/lib/tokens', () => ({
  verifyRefreshToken: mocks.verifyRefreshToken,
  buildTokenPayload: mocks.buildTokenPayload,
}))
vi.mock('@/lib/sessions', () => ({
  getSessionsCollection: mocks.getSessionsCollection,
  rotateSession: mocks.rotateSession,
}))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh' }))
vi.mock('@/lib/db', () => ({ getUsersCollection: mocks.getUsersCollection }))

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
  mocks.getSessionsCollection.mockResolvedValue({ findOne: mocks.sessionFindOne })
  mocks.sessionFindOne.mockResolvedValue(null)
  mocks.rotateSession.mockResolvedValue({ rotated: true, currentVersion: 1, remember: true })
  mocks.getUsersCollection.mockResolvedValue({ findOne: mocks.usersFindOne })
  mocks.usersFindOne.mockResolvedValue({ _id: new ObjectId(USER_ID), uid: 'uid-1' })
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
    expect(mocks.rotateSession).toHaveBeenCalledWith(
      { findOne: mocks.sessionFindOne },
      SESSION_ID,
      0,
      new ObjectId(USER_ID)
    )
    expect(mocks.buildTokenPayload).toHaveBeenCalledWith({
      id: USER_ID,
      role: 'free',
      sessionId: SESSION_ID,
      tokenVersion: 1,
    })
    const cookie = res.cookies.get('crushsvg_refresh')
    expect(cookie?.value).toBe('refresh-token')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.maxAge).toBe(7 * 24 * 60 * 60)
  })

  it('re-issues at current version when session alive despite stale version', async () => {
    mocks.rotateSession.mockResolvedValue({ rotated: false, currentVersion: 2, remember: false })
    mocks.sessionFindOne.mockResolvedValue({
      _id: new ObjectId(SESSION_ID),
      userId: new ObjectId(USER_ID),
      status: 'active',
    })
    const res = await post('stale-refresh')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mocks.buildTokenPayload).toHaveBeenCalledWith({
      id: USER_ID,
      role: 'free',
      sessionId: SESSION_ID,
      tokenVersion: 2,
    })
    expect(res.cookies.get('crushsvg_refresh')?.value).toBe('refresh-token')
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
      _id: new ObjectId(SESSION_ID),
      userId: new ObjectId(USER_ID),
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
      _id: new ObjectId(SESSION_ID),
      userId: new ObjectId('507f1f77bcf86cd799439099'),
      status: 'active',
    })
    const res = await post('foreign-refresh')
    expect(res.status).toBe(401)
    expect((await res.json()).payload.error.code).toBe('session_revoked')
  })

  it('returns 401 user_not_found and deletes cookie when user missing', async () => {
    mocks.usersFindOne.mockResolvedValue(null)
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
    expect(body.payload.error.code).toBe('rate_limited')
    expect(body.payload.error.retryAfterSeconds).toBeGreaterThan(0)
  })
})
