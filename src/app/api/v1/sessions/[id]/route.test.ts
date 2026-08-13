import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  invalidateSessionCache: vi.fn(),
  revokeSession: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({
  auth: mocks.auth,
  invalidateSessionCache: mocks.invalidateSessionCache,
}))
vi.mock('@/lib/sessions', () => ({
  revokeSession: mocks.revokeSession,
}))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh' }))

import { DELETE } from './route'

const USER_ID = '507f1f77bcf86cd799439011'
const SESSION_ID = '507f1f77bcf86cd799439012'

function del(id: string = SESSION_ID) {
  return DELETE(
    new NextRequest(`http://localhost/api/v1/sessions/${id}`, {
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    }),
    { params: Promise.resolve({ id }) }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({
    user: { id: USER_ID, role: 'free', jti: SESSION_ID },
  })
  mocks.revokeSession.mockResolvedValue(true)
})

describe('DELETE /api/v1/sessions/[id]', () => {
  it('returns 204 and revokes the owned session with cache invalidation', async () => {
    const res = await del()
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
    expect(mocks.revokeSession).toHaveBeenCalledWith(SESSION_ID, USER_ID)
    expect(mocks.invalidateSessionCache).toHaveBeenCalledWith(SESSION_ID)
  })

  it('returns 404 without side effects when session id is not a valid ObjectId', async () => {
    const res = await del('not-an-object-id')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Session not found' })
    expect(mocks.revokeSession).not.toHaveBeenCalled()
    expect(mocks.invalidateSessionCache).not.toHaveBeenCalled()
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('keeps refresh cookie when revoking a different session', async () => {
    const res = await del('507f1f77bcf86cd799439013')
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(mocks.revokeSession).toHaveBeenCalled()
  })

  it('returns 404 without side effects when session not found', async () => {
    mocks.revokeSession.mockResolvedValue(false)
    const res = await del()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Session not found' })
    expect(mocks.invalidateSessionCache).not.toHaveBeenCalled()
  })

  it('returns auth error without revoking when unauthenticated', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await del()
    expect(res.status).toBe(401)
    expect(mocks.revokeSession).not.toHaveBeenCalled()
  })
})
