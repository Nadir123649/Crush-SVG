import type { TokenPairDTO, UserDTO } from '@/lib/shared-types'

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

export function setAccessToken(token: string | null): void {
  accessToken = token
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

const REFRESH_PATH = '/api/v1/auth/refresh'

let refreshInFlight: Promise<SessionPayload | null> | null = null

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

async function doRefresh(): Promise<SessionPayload | null> {
  try {
    const res = await fetch(REFRESH_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    })
    if (!res.ok) {
      onAuthExpired?.()
      return null
    }
    const body = (await res.json().catch(() => null)) as RefreshBody | null
    if (body?.success !== true || !body.payload) {
      onAuthExpired?.()
      return null
    }
    const { token, sessionId, remember, user } = body.payload
    if (!token?.accessToken) {
      onAuthExpired?.()
      return null
    }
    setAccessToken(token.accessToken)
    activeSessionId = sessionId ?? null
    activeRemember = remember ?? null
    return { token, sessionId, remember, user }
  } catch {
    onAuthExpired?.()
    return null
  }
}

export async function refreshSession(): Promise<SessionPayload | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
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
  const token = attachAuth(headers)
  let res = await fetch(path, { ...init, headers })

  if (res.status === 401 && token) {
    const refreshed = await refreshSession()
    if (refreshed && accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`)
      res = await fetch(path, { ...init, headers })
    } else {
      throw new ApiError(401, 'session_expired', 'Session expired. Please sign in again.')
    }
  }

  return res
}

interface ErrorBody {
  error?: { code?: string; message?: string } | string
  payload?: { error?: { code?: string; message?: string } }
}

function toApiError(status: number, body: ErrorBody | null): ApiError {
  const err = body?.payload?.error ?? body?.error
  if (typeof err === 'object' && err !== null && typeof err.code === 'string') {
    return new ApiError(status, err.code, err.message ?? err.code)
  }
  if (typeof err === 'string') {
    return new ApiError(status, 'error', err)
  }
  return new ApiError(status, `http_${status}`, `Request failed with status ${status}`)
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
