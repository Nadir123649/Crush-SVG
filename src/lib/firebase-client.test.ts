import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  getAuth: vi.fn(),
  signOut: vi.fn(),
  sendEmailVerification: vi.fn(),
  currentUser: null as {
    providerData: { providerId: string }[]
    getIdToken: () => Promise<string>
  } | null,
}))

vi.mock('firebase/app', () => ({ initializeApp: mocks.initializeApp }))

vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuth,
  signOut: mocks.signOut,
  sendEmailVerification: mocks.sendEmailVerification,
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: class {},
  TwitterAuthProvider: class {},
  GithubAuthProvider: class {},
}))

import {
  exchangeIdToken,
  getErrorMessage,
  resendVerificationEmail,
  signOut,
} from '@/lib/firebase-client'

const sessionPayload = {
  user: {
    uid: 'uid-1',
    email: 't@t.com',
    displayName: 'Test User',
    photoURL: null,
    providers: ['password'],
    conversionsUsed: 0,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-01-01T00:00:00Z',
  },
  token: {
    tokenType: 'Bearer',
    accessToken: 'access-token',
    accessTokenExpires: '15m',
    refreshToken: 'refresh-token',
    refreshTokenExpires: '7d',
  },
}

function setCurrentUser(providerId?: string, idToken = 'id-token') {
  mocks.currentUser = {
    providerData: providerId ? [{ providerId }] : [],
    getIdToken: async () => idToken,
  }
  return mocks.currentUser
}

function mockFetch(response: { status: number; body?: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    json: async () => response.body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function envelope(payload: unknown) {
  return {
    success: true,
    version: '1.0.0',
    payload,
    serverTimestamp: '2026-01-01T00:00:00Z',
  }
}

function errorEnvelope(status: number, message: string) {
  return {
    success: false,
    version: '1.0.0',
    payload: { error: { code: 'test_error', message } },
    serverTimestamp: '2026-01-01T00:00:00Z',
  }
}

beforeEach(() => {
  mocks.currentUser = null
  mocks.getAuth.mockImplementation(() => ({
    get currentUser() {
      return mocks.currentUser
    },
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('exchangeIdToken', () => {
  it('posts the id token to the provider endpoint and returns the session', async () => {
    setCurrentUser('google.com')
    const fetchMock = mockFetch({ status: 200, body: envelope(sessionPayload) })

    const result = await exchangeIdToken()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/oauth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseToken: 'id-token', rememberMe: true }),
    })
    expect(result).toEqual(sessionPayload)
  })

  it('passes rememberMe false through to the server', async () => {
    setCurrentUser('google.com')
    const fetchMock = mockFetch({ status: 200, body: envelope(sessionPayload) })

    await exchangeIdToken(false)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/oauth/google',
      expect.objectContaining({
        body: JSON.stringify({ firebaseToken: 'id-token', rememberMe: false }),
      })
    )
  })

  it('maps github and twitter provider ids to endpoint names', async () => {
    const fetchMock = mockFetch({ status: 200, body: envelope(sessionPayload) })

    setCurrentUser('github.com')
    await exchangeIdToken()
    setCurrentUser('twitter.com')
    await exchangeIdToken()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/oauth/github',
      expect.anything()
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/oauth/x', expect.anything())
  })

  it('falls back to the password endpoint when no provider id is present', async () => {
    setCurrentUser()
    const fetchMock = mockFetch({ status: 200, body: envelope(sessionPayload) })

    await exchangeIdToken()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/oauth/password',
      expect.anything()
    )
  })

  it('throws when not signed in', async () => {
    await expect(exchangeIdToken()).rejects.toThrow('Not signed in')
  })

  it('throws email_not_verified on 403', async () => {
    setCurrentUser('password')
    mockFetch({ status: 403 })

    await expect(exchangeIdToken()).rejects.toThrow('email_not_verified')
  })

  it('throws auth/too-many-requests on 429', async () => {
    setCurrentUser('password')
    mockFetch({ status: 429 })

    await expect(exchangeIdToken()).rejects.toThrow('auth/too-many-requests')
  })

  it('throws a generic failure message on other errors', async () => {
    setCurrentUser('password')
    mockFetch({ status: 500, body: errorEnvelope(500, 'Failed to create session') })

    await expect(exchangeIdToken()).rejects.toThrow('Failed to create session')
  })
})

describe('signOut', () => {
  it('calls the logout endpoint then signs out of firebase', async () => {
    setCurrentUser('google.com')
    const fetchMock = mockFetch({ status: 200, body: { success: true } })

    await signOut()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/logout', {
      method: 'POST',
    })
    expect(mocks.signOut).toHaveBeenCalledWith({ currentUser: mocks.currentUser })
  })
})

describe('resendVerificationEmail', () => {
  it('sends a verification email to the current user', async () => {
    const user = setCurrentUser('password')
    await resendVerificationEmail()
    expect(mocks.sendEmailVerification).toHaveBeenCalledWith(user)
  })

  it('throws when not signed in', async () => {
    await expect(resendVerificationEmail()).rejects.toThrow('Not signed in')
  })
})

describe('getErrorMessage', () => {
  it('maps email_not_verified to a friendly message', () => {
    expect(getErrorMessage(new Error('email_not_verified'))).toBe(
      'Please verify your email before logging in'
    )
  })

  it('maps auth/too-many-requests to a friendly message', () => {
    expect(getErrorMessage(new Error('auth/too-many-requests'))).toBe(
      'Too many attempts — wait a bit and try again'
    )
  })

  it('keeps existing firebase code mappings', () => {
    expect(getErrorMessage({ code: 'auth/popup-closed-by-user' })).toBe(
      'Sign-in was cancelled'
    )
  })

  it('falls back to the default message for unknown errors', () => {
    expect(getErrorMessage(new Error('nonsense'))).toBe(
      'Something went wrong — please try again'
    )
  })
})
