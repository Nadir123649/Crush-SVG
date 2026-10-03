import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

function getFirebaseApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set"
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = () => getAuth(getFirebaseApp());

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return adminAuth().verifyIdToken(idToken);
}

export async function generatePasswordResetLink(email: string): Promise<string> {
  return adminAuth().generatePasswordResetLink(email);
}

/**
 * Fetch the current profile photoURL for a Firebase Auth user.
 * Returns null if the user is not found or has no photo.
 */
export async function getFreshPhotoURL(firebaseUid: string): Promise<string | null> {
  try {
    const userRecord = await adminAuth().getUser(firebaseUid);
    return userRecord.photoURL ?? null;
  } catch {
    return null;
  }
}

/**
 * Outcome of the People API photo lookup.
 *
 * The distinction between the two states is load-bearing:
 *
 * - `resolved`    — People API answered successfully. `photoUrl` is the user's
 *                   own uploaded photo, or `null` when Google reports no
 *                   user-provided photo (i.e. `photos[].default === true`).
 *                   A `null` here is AUTHORITATIVE and must overwrite any
 *                   previously stored Google default-avatar URL.
 * - `unavailable` — the request failed (network, 4xx/5xx, malformed body). We
 *                   learned nothing, so the caller must keep its existing
 *                   fallback behaviour rather than clearing a valid photo.
 */
export type VerifiedPhotoResult =
  | { status: "resolved"; photoUrl: string | null }
  | { status: "unavailable" };

interface PeopleApiPhoto {
  url?: string;
  default?: boolean;
}

/**
 * Resolve the signed-in user's Google profile photo using Google's own photo
 * metadata, so a Google-generated default avatar is never mistaken for a
 * user-provided photo.
 *
 * Uses the native fetch implementation — no additional dependency. Fails soft:
 * any error yields `{ status: "unavailable" }` and must never break sign-in.
 * The access token is used for this single request and is never logged or
 * persisted.
 */
export async function getVerifiedProfilePhotoUrl(
  accessToken: string,
): Promise<VerifiedPhotoResult> {
  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos&sources=PROFILE",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // Includes 401/403 (scope or consent missing) — treat as "we learned
      // nothing" rather than "this user has no photo".
      return { status: "unavailable" };
    }

    const body = (await response.json()) as { photos?: PeopleApiPhoto[] };
    const photos = Array.isArray(body?.photos) ? body.photos : [];

    // Google documents `default` as: true when the photo is a default photo,
    // false when it is user-provided. Only a non-default entry counts.
    const userProvided = photos.find(
      (photo) => photo?.default === false && typeof photo?.url === "string" && photo.url.length > 0,
    );

    return { status: "resolved", photoUrl: userProvided?.url ?? null };
  } catch {
    return { status: "unavailable" };
  }
}
