import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  providerIdToName: vi.fn(),
  resolveUserCascade: vi.fn(),
  createSession: vi.fn(),
  buildTokenPayload: vi.fn(),
  toUserDTO: vi.fn(),
}))

vi.mock('@/lib/firebase-token', () => ({ verifyIdToken: mocks.verifyIdToken }))
vi.mock('@/lib/firebase-user', () => ({
  providerIdToName: mocks.providerIdToName,
  resolveUserCascade: mocks.resolveUserCascade,
}))
vi.mock('@/lib/sessions', () => ({ createSession: mocks.createSession }))
vi.mock('@/lib/tokens', () => ({ buildTokenPayload: mocks.buildTokenPayload }))
vi.mock('@/lib/auth', () => ({ REFRESH_COOKIE_NAME: 'crushsvg_refresh', toUserDTO: mocks.toUserDTO }))

import { POST } from './route'

function fakeUser() {
  return {
    _id: new ObjectId(),
    uid: 'uid-1',
    email: 't@t.com',
    displayName: 'Test User',
    photoURL: null,
    providers: ['google'],
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
    provider: 'google',
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

function googleToken() {
  return {
    uid: 'uid-1',
    email: 't@t.com',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verifyIdToken.mockResolvedValue(googleToken())
  mocks.providerIdToName.mockImplementation((id: string) => {
    switch (id) {
      case 'google.com': return 'google'
      case 'github.com': return 'github'
      case 'twitter.com': return 'x'
      case 'password': return 'password'
      default: return id
    }
  })
  mocks.resolveUserCascade.mockResolvedValue(fakeUser())
  mocks.createSession.mockResolvedValue(fakeSession())
  mocks.buildTokenPayload.mockReturnValue(fakeTokenPair())
  mocks.toUserDTO.mockReturnValue({ uid: 'uid-1' })
})

async function errorPayload(res: Response) {
  const body = await res.json()
  return body.payload.error as { code: string; message: string }
}

describe('POST /api/v1/oauth/[[...slug]]', () => {
  it('returns 404 for unknown provider', async () => {
    const res = await post('facebook', { firebaseToken: 't' })
    expect(res.status).toBe(404)
    expect((await errorPayload(res)).code).toBe('unknown_provider')
  })

  it('returns 404 for the removed password provider', async () => {
    const res = await post('password', { firebaseToken: 't' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await post('google', undefined, '{')
    expect(res.status).toBe(400)
    expect((await errorPayload(res)).code).toBe('validation_error')
  })

  it('returns 400 for missing firebaseToken', async () => {
    const res = await post('google', {})
    expect(res.status).toBe(400)
    const err = await errorPayload(res)
    expect(err.code).toBe('validation_error')
    expect(err.message.length).toBeGreaterThan(0)
  })

  it('returns 400 when token provider does not match route provider', async () => {
    const res = await post('x', { firebaseToken: 't' })
    expect(res.status).toBe(400)
    expect((await errorPayload(res)).code).toBe('provider_mismatch')
  })

  it('returns 401 when firebase token verification fails', async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error('firebase failure'))
    const res = await post('google', { firebaseToken: 'garbage' })
    expect(res.status).toBe(401)
    expect((await errorPayload(res)).code).toBe('invalid_token')
  })

  it('returns 200 with user, token, sessionId and refresh cookie', async () => {
    const user = fakeUser()
    const session = fakeSession()
    mocks.resolveUserCascade.mockResolvedValue(user)
    mocks.createSession.mockResolvedValue(session)

    const res = await post('google', { firebaseToken: 't', rememberMe: true })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.payload).toEqual({
      user: { uid: 'uid-1' },
      token: fakeTokenPair(),
      sessionId: session._id.toString(),
    })
    expect(mocks.providerIdToName).toHaveBeenCalledWith('google.com')
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user._id,
        provider: 'google',
        remember: true,
      })
    )
    expect(mocks.buildTokenPayload).toHaveBeenCalledWith({
      id: user._id.toString(),
      role: 'user',
      sessionId: session._id.toString(),
      tokenVersion: session.tokenVersion,
    })
    const cookie = res.cookies.get('crushsvg_refresh')
    expect(cookie?.value).toBe('refresh-token')
    expect(cookie?.httpOnly).toBe(true)
  })

  it('passes rememberMe false into session creation', async () => {
    const res = await post('google', { firebaseToken: 't', rememberMe: false })
    expect(res.status).toBe(200)
    expect(mocks.createSession).toHaveBeenCalledWith(
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
    expect((await errorPayload(res)).code).toBe('rate_limit_exceeded')
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
  })
})
