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

import { useToast } from '@/components/ui/ToastProvider'
import { apiFetch, getAccessToken, getSessionId, getSessionRemember, refreshSession, setAccessToken, setAuthExpiredHandler, setSessionRemember } from '@/lib/client/http'
import type { TokenPairDTO, UserDTO } from '@/lib/shared-types'

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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'github' | 'x', rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast()
  const [user, setUser] = useState<UserDTO | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('crush_user')
        return storedUser ? JSON.parse(storedUser) : null
      } catch {}
    }
    return null
  })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedStatus = sessionStorage.getItem('crush_auth_status') as AuthStatus | null
        if (storedStatus === 'authed' || storedStatus === 'guest') {
          return storedStatus
        }
        const storedUser = localStorage.getItem('crush_user')
        return storedUser ? 'authed' : 'loading'
      } catch {}
    }
    return 'loading'
  })

  const applySession = useCallback((payload: SessionPayload) => {
    setAccessToken(payload.token.accessToken)
    setSessionId(payload.sessionId ?? null)
    setSessionRemember(payload.remember ?? null)
    setUser(payload.user)
    setStatus('authed')
    if (typeof window !== 'undefined') {
      localStorage.setItem('crush_user', JSON.stringify(payload.user))
      localStorage.removeItem('crush_usage')
      sessionStorage.setItem('crush_auth_status', 'authed')
    }
  }, [])

  const clearAuth = useCallback(() => {
    setAccessToken(null)
    setSessionId(null)
    setSessionRemember(null)
    setUser(null)
    setStatus('guest')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crush_user')
      localStorage.removeItem('crush_usage')
      sessionStorage.setItem('crush_auth_status', 'guest')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setAuthExpiredHandler(() => {
      if (!cancelled) clearAuth()
    })

    void (async () => {
      const payload = await refreshSession()
      if (cancelled) return
      if (!payload) {
        setStatus('guest')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('crush_auth_status', 'guest')
        }
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
        setStatus('guest')
        return
      }
      applySession({
        user: payload.user,
        token: payload.token,
        sessionId: payload.sessionId ?? undefined,
        remember: payload.remember ?? undefined,
      })
    })()

    return () => {
      cancelled = true
      setAuthExpiredHandler(null)
    }
  }, [applySession, clearAuth])

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const payload = await apiFetch<SessionPayload>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      })
      applySession(payload)
      addToast('Logged in successfully')
    },
    [applySession, addToast]
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
      } = await import('@/lib/firebase-client')
      const signIn = {
        google: signInWithGoogle,
        github: signInWithGitHub,
        x: signInWithX,
      }[provider]
      await signIn()
      const session = await exchangeIdToken(rememberMe)
      applySession({ user: session.user, token: session.token, sessionId: session.sessionId })
      addToast('Logged in successfully')
    },
    [applySession, addToast]
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // session already expired — still clear local state
    }
    try {
      const { signOut: firebaseSignOut } = await import('@/lib/firebase-client')
      await firebaseSignOut()
    } catch {
      // not signed in via Firebase
    }
    clearAuth()
  }, [clearAuth])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await apiFetch<{ message: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
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
      login,
      register,
      loginWithOAuth,
      logout,
      changePassword,
      resendVerification,
    }),
    [user, status, sessionId, login, register, loginWithOAuth, logout, changePassword, resendVerification]
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
