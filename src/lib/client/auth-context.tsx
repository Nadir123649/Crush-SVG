'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { apiFetch, getAccessToken, getSessionId, getSessionRemember, getSessionRestored, refreshSession, setAccessToken, setAuthExpiredHandler, setSessionRemember, setSessionRestored } from '@/lib/client/http'
import type { TokenPairDTO, UserDTO } from '@/lib/shared/shared-types'
import { defaultToastEmitter, setToastEmitter, showToast } from '@/lib/client/toast-bridge'

export type AuthStatus = 'loading' | 'authed' | 'guest'

export interface SessionPayload {
  user: UserDTO
  token: TokenPairDTO
  sessionId?: string
  remember?: boolean
}

interface AuthContextValue {
  user: UserDTO | null
  status: AuthStatus
  sessionId: string | null
  sessionVersion: number
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'github' | 'x', rememberMe?: boolean) => Promise<void>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  // Bumped whenever the access token is applied or cleared. Lets consumers
  // (e.g. usage fetching) react to the token actually being attached, which is
  // not guaranteed by `status` alone when a session is restored from storage.
  const [sessionVersion, setSessionVersion] = useState(0)

  const applySession = useCallback((payload: SessionPayload) => {
    setAccessToken(payload.token.accessToken)
    setSessionRestored(true)
    setSessionId(payload.sessionId ?? null)
    setSessionRemember(payload.remember ?? null)
    setUser(payload.user)
    setStatus('authed')
    setSessionVersion((v) => v + 1)
    if (typeof window !== 'undefined') {
      localStorage.setItem('crush_user', JSON.stringify(payload.user))
      localStorage.removeItem('crush_usage')
      sessionStorage.setItem('crush_auth_status', 'authed')
    }
  }, [])

  const clearAuth = useCallback(() => {
    setAccessToken(null)
    setSessionRestored(false)
    setSessionId(null)
    setSessionRemember(null)
    setUser(null)
    setStatus('guest')
    setSessionVersion((v) => v + 1)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crush_user')
      localStorage.removeItem('crush_usage')
      // A logged-out user must not carry the previous user's editor contents
      // to the next session.
      localStorage.removeItem('crush_converter_state')
      sessionStorage.setItem('crush_auth_status', 'guest')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    // Restore the persisted session snapshot after hydration. Reading storage
    // during render (useState initializers) would make the client's first
    // render differ from the server's, causing hydration mismatches. Deferred
    // to a microtask so it runs before the next paint without violating the
    // "no synchronous setState in effects" rule.
    queueMicrotask(() => {
      if (cancelled) return
      let restoredUser = false
      try {
        const storedUser = localStorage.getItem('crush_user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          restoredUser = true
        }
      } catch {}
      if (restoredUser) {
        // A stored user snapshot means we are authenticated. Adopt the authed
        // state immediately so the authenticated UI stays stable during a
        // refresh — a stale 'guest' marker must never flash the guest UI. The
        // mount refresh (or the first real API call) attaches the access token.
        setStatus('authed')
      } else {
        // No stored user snapshot: hold the loading state until the mount
        // refresh settles. The persisted 'guest' marker is NOT authoritative —
        // clearAuth can leave a still-valid session cookie behind (e.g. a
        // rate-limited logout), so trusting the marker would flash the guest
        // UI on refresh for a session that is actually valid. The mount
        // refresh decides; on its failure, visitors without a stored user
        // resolve to the guest state immediately.
      }
      // A restored user snapshot means the app is in an authed session even
      // before the access token arrives — API calls may refresh on demand.
      setSessionRestored(restoredUser)
    })

    setAuthExpiredHandler(() => {
      if (!cancelled) clearAuth()
    })

    setToastEmitter(defaultToastEmitter)

    // Refresh lazily: one attempt on load, then spaced-out backoff retries so a
    // fast refresh streak never floods the refresh endpoint (which trips the
    // per-IP rate limit and previously caused a PERSISTED logout). A failed
    // refresh here NEVER logs a restored user out — storage is left untouched
    // and the optimistic authed state stays put; the first real API call
    // retries the refresh and only logs out on a genuine server rejection.
    // Visitors without a stored user resolve to the guest state immediately so
    // they are never stuck on the loading screen.
    const REFRESH_BACKOFF_MS = [0, 2000, 6000, 14000]

    const attemptRefresh = async (attempt: number): Promise<void> => {
      if (cancelled) return
      const payload = await refreshSession({ silent: true })
      if (cancelled) return
      if (!payload) {
        if (getSessionRestored()) {
          // Keep the optimistic authed snapshot and retry to attach the access
          // token. If it never attaches, the next real API call decides.
          if (attempt < REFRESH_BACKOFF_MS.length - 1) {
            setTimeout(() => void attemptRefresh(attempt + 1), REFRESH_BACKOFF_MS[attempt])
            return
          }
          return
        }
        // No stored user: no optimistic session to protect. Resolve to the
        // guest state right away instead of waiting for backoff retries.
        setStatus('guest')
        return
      }

      // Session-only login (remember unchecked) without the per-tab marker means
      // the tab that logged in is gone — revoke the session and log out.
      if (getSessionRemember() === false && typeof window !== 'undefined') {
        let marker: string | null = null
        try {
          marker = sessionStorage.getItem('crush_session_only')
        } catch {}
        if (!marker) {
          void apiFetch<void>('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
          clearAuth()
          return
        }
      }
      if (!payload.user) {
        // A successful refresh should always carry the user; if it somehow
        // does not, keep the optimistic authed state for a restored user rather
        // than dropping into the guest UI.
        if (getSessionRestored()) return
        setStatus('guest')
        return
      }
      applySession({
        user: payload.user,
        token: payload.token,
        sessionId: payload.sessionId ?? undefined,
        remember: payload.remember ?? undefined,
      })
    }

    void attemptRefresh(0)

    return () => {
      cancelled = true
      setAuthExpiredHandler(null)
      setToastEmitter(null)
    }
  }, [applySession, clearAuth])

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const payload = await apiFetch<SessionPayload>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      })
      applySession(payload)
      if (rememberMe === false && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('crush_session_only', '1')
        } catch {}
      }
      showToast('success', 'Signed in successfully. Welcome back!')
    },
    [applySession]
  )

  const register = useCallback(async (name: string, email: string, password: string) => {
    await apiFetch<{ message: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  }, [])

  const loginWithOAuth = useCallback(
    async (provider: 'google' | 'github' | 'x', rememberMe = true) => {
      const {
        exchangeIdToken,
        signInWithGitHub,
        signInWithGoogle,
        signInWithX,
      } = await import('@/lib/firebase/firebase-client')
      const signIn = {
        google: signInWithGoogle,
        github: signInWithGitHub,
        x: signInWithX,
      }[provider]
      await signIn()
      const session = await exchangeIdToken(rememberMe)
      applySession({ user: session.user, token: session.token, sessionId: session.sessionId })
      if (rememberMe === false && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('crush_session_only', '1')
        } catch {}
      }
      showToast('success', 'Signed in successfully. Welcome back!')
    },
    [applySession]
  )

  const logout = useCallback(() => {
    // Clear storage so the fresh /login page loads cleanly as a guest
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crush_user')
      localStorage.removeItem('crush_usage')
      localStorage.removeItem('crush_converter_state')
      sessionStorage.setItem('crush_auth_status', 'guest')
    }
    void apiFetch<void>('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
    void import('@/lib/firebase/firebase-client')
      .then(({ signOut: firebaseSignOut }) => firebaseSignOut())
      .catch(() => {})
    window.location.href = '/'
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await apiFetch<{ message: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      showToast('success', 'Password updated. Please sign in again.')
      clearAuth()
    },
    [clearAuth]
  )

  const resendVerification = useCallback(async (email: string) => {
    await apiFetch<{ message: string }>('/api/v1/verification/email/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      sessionId,
      sessionVersion,
      login,
      register,
      loginWithOAuth,
      logout,
      changePassword,
      resendVerification,
    }),
    [user, status, sessionId, sessionVersion, login, register, loginWithOAuth, logout, changePassword, resendVerification]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
