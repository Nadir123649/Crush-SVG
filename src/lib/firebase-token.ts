import 'server-only'

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

const GOOGLE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

const FIREBASE_ISSUER = (projectId: string) => `https://securetoken.google.com/${projectId}`

const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))

export interface DecodedIdToken {
  uid: string
  email: string | null
  email_verified: boolean
  name: string | null
  picture: string | null
  firebase: {
    sign_in_provider: string
    identities?: Record<string, unknown>
  }
}

/**
 * Maps the verified Firebase ID token claims into the shape the rest of the
 * app expects.
 */
export function mapTokenPayload(payload: JWTPayload): DecodedIdToken {
  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  if (!sub) {
    throw new Error('Invalid token payload: missing subject')
  }

  const firebaseClaim =
    payload.firebase && typeof payload.firebase === 'object'
      ? (payload.firebase as Record<string, unknown>)
      : {}

  const signInProvider =
    typeof firebaseClaim.sign_in_provider === 'string' ? firebaseClaim.sign_in_provider : ''

  return {
    uid: sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    email_verified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
    firebase: {
      sign_in_provider: signInProvider,
      identities:
        firebaseClaim.identities && typeof firebaseClaim.identities === 'object'
          ? (firebaseClaim.identities as Record<string, unknown>)
          : undefined,
    },
  }
}

/**
 * Verifies a Firebase ID token against Google's public keys.
 *
 * Uses `jose` directly instead of the Firebase Admin SDK: firebase-admin
 * loads `jwks-rsa`, which `require()`s the ESM-only `jose` package at runtime
 * and crashes with ERR_REQUIRE_ESM on runtimes without `require(esm)`
 * support (e.g. some Vercel function runtimes).
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')
  }

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: FIREBASE_ISSUER(projectId),
    audience: projectId,
    algorithms: ['RS256'],
  })

  return mapTokenPayload(payload)
}