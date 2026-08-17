import 'server-only'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'

function getFirebaseApp() {
  const apps = getApps()
  if (apps.length > 0) return apps[0]

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set'
    )
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminAuth = () => getAuth(getFirebaseApp())

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return adminAuth().verifyIdToken(idToken)
}

export async function generatePasswordResetLink(email: string): Promise<string> {
  return adminAuth().generatePasswordResetLink(email)
}
