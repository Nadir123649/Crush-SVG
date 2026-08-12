import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  providerIdToName: vi.fn(),
  resolveUserCascade: vi.fn(),
  getSessionsCollection: vi.fn(),
  createSession: vi.fn(),
  buildTokenPayload: vi.fn(),
  toUserDTO: vi.fn(),
}))

vi.mock('@/lib/firebase-admin', () => ({ verifyIdToken: mocks.verifyIdToken }))
vi.mock('@/lib/firebase-user', () => ({
  providerIdToName: mocks.providerIdToName,
  resolveUserCascade: mocks.resolveUserCascade,
}))
vi.mock('@/lib/sessions', () => ({
  getSessionsCollection: mocks.getSessionsCollection,
  createSession: mocks.createSession,
}))
vi.mock('@/lib/tokens', () => ({ buildTokenPayload: mocks.buildTokenPayload }))
vi.mock('@/lib/auth', () => ({ toUserDTO: mocks.toUserDTO }))

import { POST } from './route'

function fakeUser() {
  return {
    _id: new ObjectId(),
    uid: 'uid-1',
    email: 't@t.com',
    displayName: 'Test User',
    photoURL: null,
    providers: ['password'],
    conversionsUsed: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastLoginAt: new Date('2026-01-01T00:00:00Z'),
  }
}

function fakeSession() {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(),
    provider: 'password',
    remember: true,
    tokenVersion: 0,
    status: 'active',
    rotatedAt: null,
    lastSeenAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }
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

function post(provider: string, body?: unknown, raw?: string) {
  return POST(
    new NextRequest(`http://localhost/api/v1/oauth/${provider}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    }),
    { params: Promise.resolve({ slug: [provider] }) }
  )
}

function passwordToken(emailVerified = true) {
  return {
    uid: 'uid-1',
    email: 't@t.com',
    email_verified: emailVerified,
    firebase: { sign_in_provider: 'password' },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verifyIdToken.mockResolvedValue(passwordToken(true))
  mocks.providerIdToName.mockImplementation((id: string) => id)
  mocks.resolveUserCascade.mockResolvedValue(fakeUser())
  mocks.getSessionsCollection.mockResolvedValue(null)
  mocks.createSession.mockResolvedValue(fakeSession())
  mocks.buildTokenPayload.mockReturnValue(fakeTokenPair())
  mocks.toUserDTO.mockReturnValue({ uid: 'uid-1' })
})

describe('POST /api/v1/oauth/[[...slug]]', () => {
  it('returns 404 for unknown provider', async () => {
    const res = await post('facebook', { firebaseToken: 't' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Unknown provider' })
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await post('password', undefined, '{')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON body' })
  })

  it('returns 400 with field errors for missing firebaseToken', async () => {
    const res = await post('password', {})
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.firebaseToken).toBeDefined()
  })

  it('returns 400 when token provider does not match route provider', async () => {
    mocks.verifyIdToken.mockResolvedValue(passwordToken())
    const res = await post('google', { firebaseToken: 't' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Provider mismatch' })
  })

  it('returns 403 for password provider with unverified email', async () => {
    mocks.verifyIdToken.mockResolvedValue(passwordToken(false))
    const res = await post('password', { firebaseToken: 't' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'email_not_verified' })
  })

  it('returns 401 when firebase token verification fails', async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error('firebase failure'))
    const res = await post('password', { firebaseToken: 'garbage' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid or expired token' })
  })

  it('returns 200 with user, token, sessionId and refresh cookie', async () => {
    mocks.verifyIdToken.mockResolvedValue(passwordToken(true))
    const user = fakeUser()
    const session = fakeSession()
    mocks.resolveUserCascade.mockResolvedValue(user)
    mocks.createSession.mockResolvedValue(session)

    const res = await post('password', { firebaseToken: 't', rememberMe: true })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      user: { uid: 'uid-1' },
      token: fakeTokenPair(),
      sessionId: session._id.toString(),
    })
    expect(mocks.providerIdToName).toHaveBeenCalledWith('password')
    expect(mocks.createSession).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        userId: user._id,
        provider: 'password',
        remember: true,
      })
    )
    expect(mocks.buildTokenPayload).toHaveBeenCalledWith({
      id: user._id.toString(),
      role: 'free',
      sessionId: session._id.toString(),
      tokenVersion: session.tokenVersion,
    })
    const cookie = res.cookies.get('crushsvg_refresh')
    expect(cookie?.value).toBe('refresh-token')
    expect(cookie?.httpOnly).toBe(true)
  })

  it('passes rememberMe false into session creation', async () => {
    mocks.verifyIdToken.mockResolvedValue(passwordToken(true))
    const res = await post('password', { firebaseToken: 't', rememberMe: false })
    expect(res.status).toBe(200)
    expect(mocks.createSession).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ remember: false })
    )
  })

  it('returns 429 after 10 requests within the window', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await post('github', { firebaseToken: 't' })
      expect(res.status).toBe(400)
    }
    const res = await post('github', { firebaseToken: 't' })
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('Too many requests. Try again later.')
    expect(body.retryAfterSeconds).toBeGreaterThan(0)
  })
})
