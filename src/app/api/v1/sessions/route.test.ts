import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  invalidateSessionCache: vi.fn(),
  getSessionsCollection: vi.fn(),
  listActiveSessions: vi.fn(),
  revokeAllSessions: vi.fn(),
  publishLogout: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({
  auth: mocks.auth,
  invalidateSessionCache: mocks.invalidateSessionCache,
}))
vi.mock('@/lib/sessions', () => ({
  getSessionsCollection: mocks.getSessionsCollection,
  listActiveSessions: mocks.listActiveSessions,
  revokeAllSessions: mocks.revokeAllSessions,
}))
vi.mock('@/lib/session-broker', () => ({ publishLogout: mocks.publishLogout }))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh' }))

import { GET, DELETE } from './route'

const USER_ID = '507f1f77bcf86cd799439011'

function fakeSessionDoc(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(USER_ID),
    provider: 'password',
    remember: true,
    tokenVersion: 0,
    status: 'active',
    rotatedAt: null,
    lastSeenAt: new Date('2026-01-02T00:00:00Z'),
    browser: 'Chrome',
    os: 'Windows',
    deviceType: 'desktop',
    ip: '127.0.0.1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function get() {
  return GET(
    new NextRequest('http://localhost/api/v1/sessions', {
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    })
  )
}

function del() {
  return DELETE(
    new NextRequest('http://localhost/api/v1/sessions', {
      method: 'DELETE',
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
  mocks.listActiveSessions.mockResolvedValue([])
})

describe('GET /api/v1/sessions', () => {
  it('returns 200 with session DTOs for the authenticated user', async () => {
    const docs = [
      fakeSessionDoc({ browser: 'Chrome' }),
      fakeSessionDoc({
        provider: 'google',
        remember: false,
        browser: undefined,
        os: undefined,
        deviceType: undefined,
        ip: undefined,
      }),
    ]
    mocks.listActiveSessions.mockResolvedValue(docs)

    const res = await get()
    expect(res.status).toBe(200)
    expect(mocks.listActiveSessions).toHaveBeenCalledWith(
      null,
      new ObjectId(USER_ID)
    )
    const body = await res.json()
    expect(body.sessions).toHaveLength(2)
    expect(body.sessions[0]).toEqual({
      id: docs[0]._id.toString(),
      provider: 'password',
      browser: 'Chrome',
      os: 'Windows',
      deviceType: 'desktop',
      ip: '127.0.0.1',
      remember: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-02T00:00:00.000Z',
      status: 'active',
    })
    expect(body.sessions[1]).toEqual({
      id: docs[1]._id.toString(),
      provider: 'google',
      browser: undefined,
      os: undefined,
      deviceType: undefined,
      ip: undefined,
      remember: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-02T00:00:00.000Z',
      status: 'active',
    })
  })

  it('returns auth error without listing when unauthenticated', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await get()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(mocks.listActiveSessions).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/v1/sessions', () => {
  it('returns 204 and revokes all sessions with cache clear, logout publish and cookie delete', async () => {
    const res = await del()
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(res.headers.get('set-cookie')).toContain('crushsvg_refresh=;')
    expect(mocks.revokeAllSessions).toHaveBeenCalledWith(
      null,
      new ObjectId(USER_ID),
      'revoked'
    )
    expect(mocks.invalidateSessionCache).toHaveBeenCalledWith()
    expect(mocks.publishLogout).toHaveBeenCalledWith(USER_ID)
  })

  it('returns auth error without revoking when unauthenticated', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await del()
    expect(res.status).toBe(401)
    expect(mocks.revokeAllSessions).not.toHaveBeenCalled()
    expect(mocks.publishLogout).not.toHaveBeenCalled()
  })
})
