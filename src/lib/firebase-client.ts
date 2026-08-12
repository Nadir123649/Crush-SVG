import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  TwitterAuthProvider,
  type Auth,
  type AuthError,
} from 'firebase/auth'

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
  const code = (error as AuthError)?.code ?? ''

  switch (code) {
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
}

export async function exchangeIdToken(): Promise<SessionResponse> {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) {
    throw new Error('Not signed in')
  }
  const idToken = await currentUser.getIdToken()
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!response.ok) {
    throw new Error('Failed to create session')
  }
  return response.json()
}

export async function signOut() {
  await fetch('/api/auth/session', { method: 'DELETE' })
  await firebaseSignOut(getFirebaseAuth())
}
