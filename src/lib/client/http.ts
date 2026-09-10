import type { TokenPairDTO, UserDTO } from '@/lib/shared/shared-types'
import { emitToast } from '@/lib/client/toast-bridge'
import { apiBase, API_BASE } from '@/lib/client/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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

export function setAccessToken(token: string | null): void {
  accessToken = token
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

async function doRefresh(silent = false): Promise<RefreshResult> {
  let res: Response
  try {
    res = await fetch(REFRESH_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: API_BASE ? 'include' : 'same-origin',
    })
  } catch {
    // Network failures are transient — the session is not dead.
    return { payload: null, sessionDead: false }
  }
  const body = (await res.json().catch(() => null)) as RefreshBody | null
  // The refresh route only reports a dead session authoritatively: 401
  // (revoked session / deleted user) or 200 with success:false (missing or
  // invalid token) — in all of those it also deletes the cookie. Rate limits
  // (429) and server errors are transient; clearing the session there would
  // log out a perfectly valid user and poison the stored snapshot, flashing
  // guest UI on the next refresh.
  const sessionIsDead = res.status === 401 || (res.status === 200 && body?.success !== true)
  if (res.status !== 200 || body?.success !== true || !body?.payload) {
    if (!silent && sessionIsDead) onAuthExpired?.()
    return { payload: null, sessionDead: sessionIsDead }
  }
  const { token, sessionId, remember, user } = body.payload
  if (!token?.accessToken) return { payload: null, sessionDead: true }
  setAccessToken(token.accessToken)
  activeSessionId = sessionId ?? null
  activeRemember = remember ?? null
  return { payload: { token, sessionId, remember, user }, sessionDead: false }
}

let refreshInFlight: Promise<RefreshResult> | null = null

export async function refreshSession(opts?: { silent?: boolean }): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(opts?.silent).finally(() => {
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
    let result = await refreshSession({ silent: true })
    if (!result.payload || !accessToken) {
      result = await refreshSession({ silent: true })
    }
    if (result.payload && accessToken) {
      token = accessToken
      headers.set('authorization', `Bearer ${token}`)
    } else if (result.sessionDead) {
      emitToast('error', 'Your session has expired. Please sign in again.')
      throw new ApiError(401, 'session_expired', 'Your session has expired. Please sign in again.')
    }
    // else: transient failure — proceed without token, let the API decide
  }

  let res = await fetch(apiBase(path), { ...init, headers, credentials: API_BASE ? 'include' : 'same-origin' })

  // Refresh on 401 when we have a token, or when a session was restored from
  // storage but the token isn't attached yet (e.g. the page-load refresh
  // failed). A real authenticated request is the decisive test of a session —
  // a transient failure on load must never log the user out on its own.
  if (res.status === 401 && (token || sessionRestored)) {
    const result = await refreshSession()
    if (result.payload && accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`)
      res = await fetch(apiBase(path), { ...init, headers, credentials: API_BASE ? 'include' : 'same-origin' })
    } else if (result.sessionDead) {
      emitToast('error', 'Your session has expired. Please sign in again.')
      throw new ApiError(401, 'session_expired', 'Your session has expired. Please sign in again.')
    }
    // else: transient failure — return the original 401 response as-is
  }

  return res
}

export interface ErrorBody {
  error?: { code?: string; message?: string } | string
  payload?: { error?: { code?: string; message?: string } }
}

export function toApiError(status: number, body: ErrorBody | null): ApiError {
  const err = body?.payload?.error ?? body?.error
  if (typeof err === 'object' && err !== null && typeof err.code === 'string') {
    return new ApiError(status, err.code, err.message ?? humanizeErrorCode(err.code, status))
  }
  if (typeof err === 'string') {
    return new ApiError(status, 'error', err)
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

  const body = (await res.json().catch(() => null)) as ErrorBody | null

  if (!res.ok) {
    throw toApiError(res.status, body)
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
    throw toApiError(res.status, body)
  }

  return res.blob()
}
