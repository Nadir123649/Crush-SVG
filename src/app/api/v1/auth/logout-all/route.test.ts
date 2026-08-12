import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  invalidateSessionCache: vi.fn(),
  getSessionsCollection: vi.fn(),
  revokeAllSessions: vi.fn(),
  publishLogout: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({
  auth: mocks.auth,
  invalidateSessionCache: mocks.invalidateSessionCache,
}))
vi.mock('@/lib/sessions', () => ({
  getSessionsCollection: mocks.getSessionsCollection,
  revokeAllSessions: mocks.revokeAllSessions,
}))
vi.mock('@/lib/session-broker', () => ({ publishLogout: mocks.publishLogout }))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh' }))

import { POST } from './route'

const USER_ID = '507f1f77bcf86cd799439011'

function post() {
  return POST(
    new NextRequest('http://localhost/api/v1/auth/logout-all', {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({
    user: { id: USER_ID, role: 'free', jti: '507f1f77bcf86cd799439012' },
  })
  mocks.getSessionsCollection.mockResolvedValue(null)
})

describe('POST /api/v1/auth/logout-all', () => {
  it('returns 200 with message, revokes all and deletes cookie', async () => {
    const res = await post()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      payload: { message: 'Logged out from all devices' },
    })
    expect(mocks.revokeAllSessions).toHaveBeenCalledWith(
      null,
      new ObjectId(USER_ID),
      'logged_out'
    )
    expect(mocks.invalidateSessionCache).toHaveBeenCalledWith()
    expect(mocks.publishLogout).toHaveBeenCalledWith(USER_ID)
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('returns auth error when not authenticated', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await post()
    expect(res.status).toBe(401)
    expect(mocks.revokeAllSessions).not.toHaveBeenCalled()
    expect(mocks.publishLogout).not.toHaveBeenCalled()
  })
})
