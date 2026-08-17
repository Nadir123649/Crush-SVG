import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  signOut as firebaseSignOut,
  TwitterAuthProvider,
  type Auth,
  type AuthError,
} from 'firebase/auth'

import type { UserDTO } from '@/lib/shared-types'

const PROVIDER_URL_MAP: Record<string, string> = {
  'google.com': 'google',
  'github.com': 'github',
  'twitter.com': 'x',
}

let app: FirebaseApp | undefined
let auth: Auth | undefined

export function getFirebaseAuth(): Auth {
  if (auth) return auth
  if (!app) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
  }
  auth = getAuth(app)
  return auth
}

export function getErrorMessage(error: unknown): string {
  const e = error as AuthError
  const code = e?.code ?? ''
  const message = e?.message ?? ''

  switch (code || message) {
    case 'email_not_verified':
      return 'Please verify your email before logging in'
    case 'auth/too-many-requests':
      return 'Too many attempts — wait a bit and try again'
    case 'auth/invalid-credential':
      return "That email and password don't match — try again"
    case 'auth/invalid-email':
      return 'Enter a valid email address'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase — add it under Authentication > Settings > Authorized domains'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase — enable it under Authentication > Sign-in method'
    case 'auth/popup-blocked':
      return 'Popup was blocked — allow popups for this site and try again'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method'
    default:
      return 'Something went wrong — please try again'
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
}

export async function signInWithX() {
  return signInWithPopup(getFirebaseAuth(), new TwitterAuthProvider())
}

export async function signInWithGitHub() {
  return signInWithPopup(getFirebaseAuth(), new GithubAuthProvider())
}

export interface SessionResponse {
  user: UserDTO
  token: {
    tokenType: 'Bearer'
    accessToken: string
    accessTokenExpires: string
    refreshToken: string
    refreshTokenExpires: string
  }
}

export async function exchangeIdToken(rememberMe = true): Promise<SessionResponse> {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) {
    throw new Error('Not signed in')
  }
  const providerId = currentUser.providerData[0]?.providerId
  const provider = providerId ? (PROVIDER_URL_MAP[providerId] ?? 'password') : 'password'
  const idToken = await currentUser.getIdToken()
  const response = await fetch(`/api/v1/oauth/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebaseToken: idToken, rememberMe }),
  })
  if (response.status === 403) {
    throw new Error('email_not_verified')
  }
  if (response.status === 429) {
    throw new Error('auth/too-many-requests')
  }
  const body = (await response.json().catch(() => null)) as
    | { success?: boolean; payload?: SessionResponse & { error?: { code?: string; message?: string } } }
    | null
  if (!response.ok) {
    throw new Error(body?.payload?.error?.message ?? 'Failed to create session')
  }
  if (body?.success === true && body.payload) {
    return body.payload as SessionResponse
  }
  throw new Error('Failed to create session')
}

export async function resendVerificationEmail(): Promise<void> {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) {
    throw new Error('Not signed in')
  }
  await sendEmailVerification(currentUser)
}

export async function signOut() {
  await fetch('/api/v1/auth/logout', { method: 'POST' })
  await firebaseSignOut(getFirebaseAuth())
}
