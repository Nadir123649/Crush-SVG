import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  TwitterAuthProvider,
  type Auth,
  type AuthError,
} from 'firebase/auth'

const PROVIDER_URL_MAP: Record<string, string> = {
  'google.com': 'google',
  'github.com': 'github',
  'twitter.com': 'x',
  password: 'password',
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
    case 'auth/email-already-in-use':
      return "That email's already registered — log in instead?"
    case 'auth/weak-password':
      return 'Use at least 8 characters'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "That email and password don't match — try again"
    case 'auth/invalid-email':
      return 'Enter a valid email address'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled'
    default:
      return 'Something went wrong — please try again'
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: { uid: string; email: string | null } }> {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password
  )
  return {
    user: {
      uid: credential.user.uid,
      email: credential.user.email,
    },
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: { uid: string; email: string | null } }> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password
  )
  return {
    user: {
      uid: credential.user.uid,
      email: credential.user.email,
    },
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

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email)
}

export interface SessionResponse {
  user: {
    uid: string
    email: string | null
    displayName: string
    photoURL: string | null
    providers: string[]
    conversionsUsed: number
    createdAt: string
    lastLoginAt: string
  }
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
  const providerId = currentUser.providerData[0]?.providerId ?? 'password'
  const provider = PROVIDER_URL_MAP[providerId] ?? 'password'
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
  if (!response.ok) {
    throw new Error('Failed to create session')
  }
  return response.json()
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
