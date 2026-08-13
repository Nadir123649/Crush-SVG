import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  invalidateSessionCache: vi.fn(),
  revokeAllSessions: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({
  auth: mocks.auth,
  invalidateSessionCache: mocks.invalidateSessionCache,
}))
vi.mock('@/lib/sessions', () => ({
  revokeAllSessions: mocks.revokeAllSessions,
}))
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
    expect(mocks.revokeAllSessions).toHaveBeenCalledWith(USER_ID, 'logged_out')
    expect(mocks.invalidateSessionCache).toHaveBeenCalledWith()
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
  })

  it('returns auth error when not authenticated', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await post()
    expect(res.status).toBe(401)
    expect(mocks.revokeAllSessions).not.toHaveBeenCalled()
  })
})
