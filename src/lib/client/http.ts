import type { TokenPairDTO, UserDTO } from '@/lib/shared/shared-types'
import { emitToast } from '@/lib/client/toast-bridge'
import { apiBase, API_BASE } from '@/lib/client/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Seconds the server asked us to wait (429), when it said so. */
  readonly retryAfter?: number

  constructor(status: number, code: string, message: string, retryAfter?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

let accessToken: string | null = null
let activeSessionId: string | null = null
let activeRemember: boolean | null = null
// True when a user snapshot was restored from storage (page load) but the
// access token may not be attached yet. Lets authFetch attempt a refresh on
// 401 even without a token, making the first real API call the decisive point
// for a session instead of a page-load refresh hiccup.
let sessionRestored = false

// Refresh this long before the access token expires (capped at 20% of its
// lifetime so short-lived tokens still get a useful window). Must exceed the
// sum of PROACTIVE_RETRY_DELAYS_MS (100s) so every retry can run before expiry.
const PROACTIVE_REFRESH_MARGIN_MS = 120_000
// setTimeout overflows above 2^31-1 ms (~24.8 days).
const MAX_TIMER_MS = 2_147_483_647
// Backoff for retrying a proactive refresh that failed transiently.
const PROACTIVE_RETRY_DELAYS_MS = [10_000, 30_000, 60_000]

let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null

// Lifetime from the token's own iat/exp. The token was just issued, so this
// avoids depending on the client clock agreeing with the server's.
function tokenLifetimeMs(token: string): number | null {
  try {
    const part = token.split('.')[1]
    const claims = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof claims.exp === 'number' && typeof claims.iat === 'number') {
      return (claims.exp - claims.iat) * 1000
    }
  } catch { }
  return null
}

function scheduleProactiveRefresh(token: string | null): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer)
    proactiveRefreshTimer = null
  }
  if (!token || typeof window === 'undefined') return
  const lifetime = tokenLifetimeMs(token)
  if (lifetime === null) return
  const delay = lifetime - Math.min(PROACTIVE_REFRESH_MARGIN_MS, lifetime * 0.2)
  if (delay <= 0 || delay > MAX_TIMER_MS) return
  const expiresAt = Date.now() + lifetime
  const attempt = (retry: number) => {
    proactiveRefreshTimer = null
    // Shares the in-flight promise with any 401-triggered refresh. Only a
    // rejected session logs out; a transient failure (5xx, timeout, network)
    // is retried with backoff until the current token expires, after which
    // the 401 path takes over.
    void refreshSession({ silent: true }).then((result) => {
      // A newer token (or logout) has taken over and rescheduled/cleared us.
      if (accessToken !== token || result.payload) return
      if (result.sessionDead) {
        onAuthExpired?.()
        emitToast('error', SESSION_EXPIRED_MESSAGE)
        return
      }
      const next = PROACTIVE_RETRY_DELAYS_MS[retry]
      if (next === undefined || Date.now() + next >= expiresAt) return
      proactiveRefreshTimer = setTimeout(() => attempt(retry + 1), next)
    })
  }
  proactiveRefreshTimer = setTimeout(() => attempt(0), delay)
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  scheduleProactiveRefresh(token)
}

export function setSessionRestored(restored: boolean): void {
  sessionRestored = restored
}

export function getSessionRestored(): boolean {
  return sessionRestored
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getSessionId(): string | null {
  return activeSessionId
}

export function setSessionId(sessionId: string | null): void {
  activeSessionId = sessionId
}

export function getSessionRemember(): boolean | null {
  return activeRemember
}

export function setSessionRemember(remember: boolean | null): void {
  activeRemember = remember
}

type AuthExpiredHandler = () => void

let onAuthExpired: AuthExpiredHandler | null = null

export function setAuthExpiredHandler(handler: AuthExpiredHandler | null): void {
  onAuthExpired = handler
}

const REFRESH_PATH = apiBase('/api/v1/auth/refresh')

export interface SessionPayload {
  token: TokenPairDTO
  sessionId?: string
  remember?: boolean
  user?: UserDTO
}

interface RefreshBody {
  success?: boolean
  payload?: {
    token?: TokenPairDTO
    sessionId?: string
    remember?: boolean
    user?: UserDTO
  }
}

export interface RefreshResult {
  payload: SessionPayload | null
  sessionDead: boolean
}

// A refresh that never answers must not hold up the request waiting on it.
const REFRESH_TIMEOUT_MS = 8_000

async function doRefresh(silent = false): Promise<RefreshResult> {
  const signal = AbortSignal.timeout(REFRESH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(REFRESH_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: API_BASE ? 'include' : 'same-origin',
      signal,
    })
  } catch {
    // Network failures and timeouts are transient — the session is not dead.
    return { payload: null, sessionDead: false }
  }
  let bodyFailed = false
  const body = (await res.json().catch(() => {
    bodyFailed = true
    return null
  })) as RefreshBody | null
  // Timed out while reading the body: a missing body here says nothing about
  // the session, so it must not fall through to the "200 without success" rule.
  if (bodyFailed && signal.aborted) {
    return { payload: null, sessionDead: false }
  }
  // The refresh route only reports a dead session authoritatively: 401/403
  // (revoked session / deleted user) or 200 with success:false (missing or
  // invalid token) — in all of those it also deletes the cookie. Rate limits
  // (429) and server errors are transient; clearing the session there would
  // log out a perfectly valid user and poison the stored snapshot, flashing
  // guest UI on the next refresh.
  if (res.status >= 500) {
    refreshServerErrorStreak++
    return { payload: null, sessionDead: false }
  }
  const sessionIsDead = res.status === 401 || res.status === 403 || (res.status === 200 && body?.success !== true)
  if (res.status !== 200 || body?.success !== true || !body?.payload) {
    if (!silent && sessionIsDead) onAuthExpired?.()
    return { payload: null, sessionDead: sessionIsDead }
  }
  const { token, sessionId, remember, user } = body.payload
  if (!token?.accessToken) return { payload: null, sessionDead: true }
  refreshServerErrorStreak = 0
  setAccessToken(token.accessToken)
  activeSessionId = sessionId ?? null
  activeRemember = remember ?? null
  return { payload: { token, sessionId, remember, user }, sessionDead: false }
}

let refreshInFlight: Promise<RefreshResult> | null = null

// Circuit-breaker: after this many consecutive 5xx responses from the refresh
// endpoint, stop retrying until the page is reloaded. Prevents an infinite
// loop of authFetch → 401 → refresh → 500 → authFetch → …
let refreshServerErrorStreak = 0
const REFRESH_SERVER_ERROR_CAP = 3

export function resetRefreshCircuitBreaker(): void {
  refreshServerErrorStreak = 0
}

export async function refreshSession(opts?: { silent?: boolean }): Promise<RefreshResult> {
  if (refreshServerErrorStreak >= REFRESH_SERVER_ERROR_CAP) {
    return { payload: null, sessionDead: false }
  }
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(opts?.silent)
      .then((result) => {
        // A successful refresh resets the streak.
        if (result.payload) refreshServerErrorStreak = 0
        return result
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

function attachAuth(headers: Headers): string | null {
  const token = accessToken
  if (token) headers.set('authorization', `Bearer ${token}`)
  return token
}

const TIMEOUT_MESSAGE = 'The request timed out. Please try again or use a smaller input.'

/**
 * A signal that aborts when `signal` aborts (keeping its reason) or after `ms`
 * with a TimeoutError — whichever comes first. Unlike `signal ?? timeout`,
 * a caller-supplied signal no longer switches the timeout off.
 */
export function withTimeoutSignal(signal: AbortSignal | null | undefined, ms: number): AbortSignal {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new DOMException('The operation timed out.', 'TimeoutError')),
    ms
  )
  const forward = () => {
    clearTimeout(timer)
    controller.abort(signal?.reason)
  }
  if (signal?.aborted) forward()
  else signal?.addEventListener('abort', forward, { once: true })
  return controller.signal
}

/** Resolves like `promise`, but rejects as soon as `signal` aborts. */
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal | null | undefined): Promise<T> {
  if (!signal) return promise
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(toAbortError(signal.reason))
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}

function toAbortError(reason: unknown): unknown {
  if (reason instanceof DOMException && reason.name === 'TimeoutError') {
    return new ApiError(504, 'timeout', TIMEOUT_MESSAGE)
  }
  return reason
}

async function executeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new ApiError(504, 'timeout', TIMEOUT_MESSAGE)
    }
    if (
      err instanceof DOMException ||
      (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch'))
    ) {
      throw new ApiError(
        0,
        'network_error',
        'Unable to complete request. The image or payload may exceed network limits, or the connection was interrupted.'
      )
    }
    throw err
  }
}

export const SESSION_EXPIRED_MESSAGE = 'Session expired, please log in again.'
export const SERVER_ERROR_MESSAGE = 'Server error, try again later.'

// The single place a dead session is reported: clears auth state and shows one
// toast. Callers must not add their own toast for code 'session_expired'.
function throwSessionExpired(): never {
  onAuthExpired?.()
  emitToast('error', SESSION_EXPIRED_MESSAGE)
  throw new ApiError(401, 'session_expired', SESSION_EXPIRED_MESSAGE)
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  let token = attachAuth(headers)

  // A restored session (page refresh) may not have its access token attached
  // yet. Attach it BEFORE sending the request so protected endpoints (convert,
  // download, ...) can never silently execute through the guest path. The
  // first attempt deduplicates with an in-flight refresh (e.g. the page-load
  // refresh); if that one failed, one fresh attempt gets another chance. Both
  // are silent: a transient failure must never log the user out — storage is
  // left untouched and the page-load backoff retries keep running. If the
  // session genuinely cannot be restored, surface session_expired instead of
  // sending the request unauthenticated.
  if (!token && sessionRestored) {
    // The refresh is shared (single-flight), so the caller's abort/timeout only
    // stops this request from waiting on it — it does not cancel the refresh.
    const result = await untilAborted(refreshSession({ silent: true }), init.signal)
    if (result.payload && accessToken) {
      token = accessToken
      headers.set('authorization', `Bearer ${token}`)
    } else if (result.sessionDead) {
      throwSessionExpired()
    }
    // else: transient failure — proceed without token, let the API decide
  }

  let res = await executeFetch(apiBase(path), { ...init, headers, credentials: API_BASE ? 'include' : 'same-origin' })

  // Refresh on 401 when we have a token, or when a session was restored from
  // storage but the token isn't attached yet (e.g. the page-load refresh
  // failed). A real authenticated request is the decisive test of a session —
  // a transient failure on load must never log the user out on its own.
  if (res.status === 401 && (token || sessionRestored)) {
    const result = await untilAborted(refreshSession({ silent: true }), init.signal)
    if (result.payload && accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`)
      res = await executeFetch(apiBase(path), { ...init, headers, credentials: API_BASE ? 'include' : 'same-origin' })
    } else if (result.sessionDead) {
      throwSessionExpired()
    } else {
      // Transient refresh failure (5xx / network): the session may be fine, so
      // do not log out — but the 401 is the server's fault, not the user's.
      throw new ApiError(503, 'server_error', SERVER_ERROR_MESSAGE)
    }
  }

  return res
}

export interface ErrorBody {
  error?: { code?: string; message?: string; retryAfter?: number } | string
  payload?: { error?: { code?: string; message?: string; retryAfter?: number } }
  // Flat shape used by 401 responses: { success:false, code, message }
  code?: string
  message?: string
}

function parseRetryAfter(body: ErrorBody | null, headers?: Headers): number | undefined {
  const err = body?.payload?.error ?? body?.error
  const fromBody = typeof err === 'object' && err !== null ? err.retryAfter : undefined
  // Retry-After may also be an HTTP date; only the delta-seconds form is used here.
  const value = fromBody ?? Number(headers?.get('retry-after'))
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined
}

export function toApiError(status: number, body: ErrorBody | null, headers?: Headers): ApiError {
  const err = body?.payload?.error ?? body?.error
  if (typeof err === 'object' && err !== null && typeof err.code === 'string') {
    const retryAfter = status === 429 ? parseRetryAfter(body, headers) : undefined
    return new ApiError(status, err.code, err.message ?? humanizeErrorCode(err.code, status), retryAfter)
  }
  if (typeof err === 'string') {
    return new ApiError(status, 'error', err)
  }
  if (typeof body?.code === 'string') {
    return new ApiError(status, body.code, body.message ?? humanizeErrorCode(body.code, status))
  }
  if (typeof body?.payload === 'object' && body.payload !== null && typeof (body.payload as Record<string, unknown>).message === 'string') {
    return new ApiError(status, `http_${status}`, (body.payload as { message: string }).message)
  }
  return new ApiError(status, `http_${status}`, humanizeErrorCode(`http_${status}`, status))
}

function humanizeErrorCode(code: string, status: number): string {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 413) return 'The file is too large. Please try a smaller file.'
  if (status === 429) return 'Too many requests. Please try again later.'
  if (status === 502 || status === 503) return 'The service is temporarily unavailable. Please try again.'
  if (status >= 500) return 'Something went wrong on our end. Please try again.'
  return `Request failed with status ${status}`
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(path, init)

  if (res.status === 204) {
    return undefined as T
  }

  const body = (await res.json().catch(() => {
    // Aborted/timed out mid-body: surface it instead of resolving with null.
    if (init.signal?.aborted) throw toAbortError(init.signal.reason)
    return null
  })) as ErrorBody | null

  if (!res.ok) {
    throw toApiError(res.status, body, res.headers)
  }

  if (body && typeof body === 'object' && (body as { success?: boolean }).success === true) {
    return (body as { payload?: T }).payload as T
  }

  return body as unknown as T
}

export async function apiBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const headers = new Headers(init.headers)
  if (!headers.has('accept')) headers.set('accept', 'application/octet-stream')
  const res = await authFetch(path, { ...init, headers })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null
    throw toApiError(res.status, body, res.headers)
  }

  return res.blob()
}
