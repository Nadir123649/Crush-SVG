import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  invalidateSessionCache: vi.fn(),
  getSessionsCollection: vi.fn(),
  revokeSession: vi.fn(),
  publishLogout: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({
  auth: mocks.auth,
  invalidateSessionCache: mocks.invalidateSessionCache,
}))
vi.mock('@/lib/sessions', () => ({
  getSessionsCollection: mocks.getSessionsCollection,
  revokeSession: mocks.revokeSession,
}))
vi.mock('@/lib/session-broker', () => ({ publishLogout: mocks.publishLogout }))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh' }))

import { POST } from './route'

const USER_ID = '507f1f77bcf86cd799439011'
const SESSION_ID = '507f1f77bcf86cd799439012'

function post() {
  return POST(
    new NextRequest('http://localhost/api/v1/auth/logout', {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({
    user: { id: USER_ID, role: 'free', jti: SESSION_ID },
  })
  mocks.getSessionsCollection.mockResolvedValue(null)
  mocks.revokeSession.mockResolvedValue(true)
})

describe('POST /api/v1/auth/logout', () => {
  it('returns 200 with success message and deletes cookie', async () => {
    const res = await post()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      payload: { message: 'Logged out successfully' },
    })
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('revokes session, invalidates cache and publishes logout when authenticated', async () => {
    await post()
    expect(mocks.revokeSession).toHaveBeenCalledWith(
      null,
      SESSION_ID,
      new ObjectId(USER_ID)
    )
    expect(mocks.invalidateSessionCache).toHaveBeenCalledWith(SESSION_ID)
    expect(mocks.publishLogout).toHaveBeenCalledWith(USER_ID)
  })

  it('skips revocation when access token has no jti', async () => {
    mocks.auth.mockResolvedValue({ user: { id: USER_ID, role: 'free' } })
    const res = await post()
    expect(res.status).toBe(200)
    expect(mocks.revokeSession).not.toHaveBeenCalled()
    expect(mocks.invalidateSessionCache).not.toHaveBeenCalled()
    expect(mocks.publishLogout).not.toHaveBeenCalled()
  })

  it('returns 200 without revocation when auth fails', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await post()
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
    expect(mocks.revokeSession).not.toHaveBeenCalled()
    expect(mocks.invalidateSessionCache).not.toHaveBeenCalled()
  })
})
