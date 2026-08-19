import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  apiBlob,
  apiFetch,
  getAccessToken,
  getSessionId,
  refreshSession,
  setAccessToken,
  setAuthExpiredHandler,
  setSessionId,
  setSessionRestored,
} from '@/lib/client/http'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('http client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken(null)
    setSessionId(null)
    setAuthExpiredHandler(null)
    setSessionRestored(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('attaches the bearer token from the token store', async () => {
    setAccessToken('abc')
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, payload: { ok: 1 } }))

    await apiFetch('/api/v1/foo')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/foo')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer abc')
  })

  it('returns the envelope payload on success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, version: '1.0.0', payload: { data: 'x' } })
    )
    await expect(apiFetch('/api/v1/foo')).resolves.toEqual({ data: 'x' })
  })

  it('returns the flat body when no envelope is present', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user: { uid: 'u1' } }))
    await expect(apiFetch('/api/me')).resolves.toEqual({ user: { uid: 'u1' } })
  })

  it('throws ApiError with code from the envelope on failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(429, {
        success: false,
        payload: { error: { code: 'rate_limit_exceeded', message: 'Too many requests.' } },
      })
    )
    await expect(apiFetch('/api/v1/foo')).rejects.toMatchObject({
      status: 429,
      code: 'rate_limit_exceeded',
      message: 'Too many requests.',
    })
  })

  it('throws ApiError with the flat error string on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, { error: 'That is not valid SVG' }))
    await expect(apiFetch('/api/v1/foo')).rejects.toMatchObject({
      status: 422,
      code: 'error',
      message: 'That is not valid SVG',
    })
  })

  it('refreshes once and retries the original request on 401', async () => {
    setAccessToken('expired')
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          payload: {
            token: { accessToken: 'fresh' },
            sessionId: 'sess-1',
          },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: { ok: 1 } }))

    await expect(apiFetch('/api/v1/foo')).resolves.toEqual({ ok: 1 })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresh')
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/foo')
    expect(getAccessToken()).toBe('fresh')
    expect(getSessionId()).toBe('sess-1')
  })

  it('throws session_expired when refresh fails and notifies the handler', async () => {
    setAccessToken('expired')
    const handler = vi.fn()
    setAuthExpiredHandler(handler)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false, payload: { error: { code: 'session_revoked' } } }))

    await expect(apiFetch('/api/v1/foo')).rejects.toMatchObject({
      status: 401,
      code: 'session_expired',
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not attempt refresh when the request had no token and no restored session', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))

    await expect(apiFetch('/api/v1/foo')).rejects.toMatchObject({ status: 401 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('attaches a restored session token before a tokenless authenticated request', async () => {
    setSessionRestored(true)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          payload: {
            token: { accessToken: 'fresh' },
            sessionId: 'sess-1',
          },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: { ok: 1 } }))

    await expect(apiFetch('/api/v1/convert')).resolves.toEqual({ ok: 1 })

    // Refresh happens BEFORE the protected request so it can never fall back to
    // the guest path on the server.
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/auth/refresh',
      '/api/v1/convert',
    ])
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('authorization')).toBe('Bearer fresh')
    expect(getAccessToken()).toBe('fresh')
    expect(getSessionId()).toBe('sess-1')
  })

  it('attaches a restored session token before a tokenless download', async () => {
    setSessionRestored(true)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          payload: { token: { accessToken: 'fresh' } },
        })
      )
      .mockResolvedValueOnce(new Response(new Blob(['png-data']), { status: 200 }))

    const blob = await apiBlob('/api/v1/convert?download=1')

    expect(await blob.text()).toBe('png-data')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/auth/refresh',
      '/api/v1/convert?download=1',
    ])
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('authorization')).toBe('Bearer fresh')
  })

  it('deduplicates the pre-flight refresh across concurrent tokenless requests', async () => {
    setSessionRestored(true)

    let resolveRefresh: (r: Response) => void = () => {}
    const counts = new Map<string, number>()
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/v1/auth/refresh') {
        return new Promise((resolve) => {
          resolveRefresh = resolve
        })
      }
      const n = counts.get(url) ?? 0
      counts.set(url, n + 1)
      return Promise.resolve(jsonResponse(200, { success: true, payload: { ok: 1 } }))
    })

    const p1 = apiFetch('/api/v1/a')
    const p2 = apiFetch('/api/v1/b')
    await new Promise((r) => setTimeout(r, 0))
    resolveRefresh(
      jsonResponse(200, { success: true, payload: { token: { accessToken: 'fresh' } } })
    )
    await Promise.all([p1, p2])

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')
    expect(refreshCalls).toHaveLength(1)
    const originalCalls = fetchMock.mock.calls.filter(([url]) => url !== '/api/v1/auth/refresh')
    expect(originalCalls).toHaveLength(2)
    for (const [, init] of originalCalls) {
      expect(new Headers(init.headers).get('authorization')).toBe('Bearer fresh')
    }
  })

  it('recovers with a fresh refresh when the deduped pre-flight attempt failed', async () => {
    setSessionRestored(true)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          payload: { token: { accessToken: 'fresh' } },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: { ok: 1 } }))

    await expect(apiFetch('/api/v1/convert')).resolves.toEqual({ ok: 1 })

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/auth/refresh',
      '/api/v1/auth/refresh',
      '/api/v1/convert',
    ])
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('authorization')).toBe('Bearer fresh')
  })

  it('throws session_expired without downgrading to guest when a restored session cannot refresh', async () => {
    setSessionRestored(true)
    const handler = vi.fn()
    setAuthExpiredHandler(handler)
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }))

    await expect(apiFetch('/api/v1/convert')).rejects.toMatchObject({
      status: 401,
      code: 'session_expired',
    })

    // Both pre-flight attempts are silent: a transient failure must not log
    // the user out, and the protected request is never sent unauthenticated.
    expect(handler).not.toHaveBeenCalled()
    const urls = fetchMock.mock.calls.map(([url]) => url)
    expect(urls).toEqual(['/api/v1/auth/refresh', '/api/v1/auth/refresh'])
    expect(urls).not.toContain('/api/v1/convert')
  })

  it('refreshes at most once more after a 401 following a successful pre-flight', async () => {
    setSessionRestored(true)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          payload: { token: { accessToken: 'fresh' } },
        })
      )
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          payload: { token: { accessToken: 'fresher' } },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: { ok: 1 } }))

    await expect(apiFetch('/api/v1/convert')).resolves.toEqual({ ok: 1 })

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/auth/refresh',
      '/api/v1/convert',
      '/api/v1/auth/refresh',
      '/api/v1/convert',
    ])
    expect(new Headers(fetchMock.mock.calls[3][1].headers).get('authorization')).toBe('Bearer fresher')
    expect(getAccessToken()).toBe('fresher')
  })

  it('does not pre-flight refresh for a tokenless guest request', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        payload: { conversionsUsed: 1, remaining: 2, isUnlimited: false },
      })
    )

    await expect(apiFetch('/api/v1/usage')).resolves.toEqual({
      conversionsUsed: 1,
      remaining: 2,
      isUnlimited: false,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/usage')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has('authorization')).toBe(false)
  })

  it('deduplicates concurrent refreshes (single flight)', async () => {
    setAccessToken('expired')

    let resolveRefresh: (r: Response) => void = () => {}
    const counts = new Map<string, number>()
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/v1/auth/refresh') {
        return new Promise((resolve) => {
          resolveRefresh = resolve
        })
      }
      const n = counts.get(url) ?? 0
      counts.set(url, n + 1)
      if (n === 0) {
        return Promise.resolve(jsonResponse(401, { error: 'Unauthorized' }))
      }
      return Promise.resolve(jsonResponse(200, { success: true, payload: { ok: 1 } }))
    })

    const p1 = apiFetch('/api/v1/a')
    const p2 = apiFetch('/api/v1/b')
    await new Promise((r) => setTimeout(r, 0))
    resolveRefresh(
      jsonResponse(200, { success: true, payload: { token: { accessToken: 'fresh' } } })
    )
    await Promise.all([p1, p2])

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')
    expect(refreshCalls).toHaveLength(1)
  })

  it('returns undefined for 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiFetch('/api/v1/foo', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('apiBlob returns the response blob', async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(['png-data']), { status: 200 }))
    const blob = await apiBlob('/api/v1/convert?download=1')
    expect(await blob.text()).toBe('png-data')
  })

  it('notifies the handler when the refresh cookie is missing', async () => {
    const handler = vi.fn()
    setAuthExpiredHandler(handler)
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: false, payload: { error: { code: 'token_missing' } } })
    )
    await expect(refreshSession()).resolves.toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
  })

  it('does not clear the session when the refresh is rate limited', async () => {
    setAccessToken('abc')
    const handler = vi.fn()
    setAuthExpiredHandler(handler)
    fetchMock.mockResolvedValue(
      jsonResponse(429, {
        success: false,
        payload: { error: { code: 'rate_limited' } },
        ...{ retryAfterSeconds: 1 },
      })
    )

    await expect(refreshSession()).resolves.toBeNull()

    // 429 is transient: the cookie survives server-side, so clearing the
    // session here would log out a valid user and poison the stored snapshot.
    expect(handler).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe('abc')
  })

  it('does not clear the session when the refresh request fails on the network', async () => {
    setAccessToken('abc')
    const handler = vi.fn()
    setAuthExpiredHandler(handler)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(refreshSession()).resolves.toBeNull()

    expect(handler).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe('abc')
  })

  it('still notifies the handler on an authoritative dead session', async () => {
    const handler = vi.fn()
    setAuthExpiredHandler(handler)
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: false, payload: { error: { code: 'token_invalid' } } })
    )
    await expect(refreshSession()).resolves.toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ApiError carries status and code', () => {
    const err = new ApiError(422, 'invalid_svg', 'bad')
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(422)
    expect(err.code).toBe('invalid_svg')
    expect(err.message).toBe('bad')
    expect(err.name).toBe('ApiError')
  })
})
