# CrushSVG OAuth + Auth Backend — Design

Date: 2026-08-11
Branch: `CrushSVG-Backend`
Status: Approved

## Context

CrushSVG is an SVG→PNG converter. Product spec (landing page master doc v4) defines an account system: 3 free guest conversions, then signup/login gate. Accounts store only email + conversion count. Conversion itself stays client-side (browser canvas).

This build = first backend slice: **authentication only**. Usage tracking/gating ships later.

## Decisions (confirmed with user)

- Auth: **Firebase Auth** with 4 providers — Google, X (Twitter), GitHub, Email/Password
- User data: **MongoDB** (users collection), official `mongodb` driver, no ORM
- Backend: **Next.js Route Handlers** (`app/api/*`) inside the existing Next 16.3.0 app
- Sessions: **Firebase session cookies** (Approach A) — httpOnly, server-verifiable
- Scope: auth only. `conversionsUsed` field exists on the model but no gating logic yet

## Architecture

```
Browser (Firebase JS SDK)
  ├─ signInWithPopup (Google/X/GitHub) | createUserWithEmailAndPassword
  │    / signInWithEmailAndPassword (email)
  ├─ sendPasswordResetEmail (forgot)
  └─ idToken ──POST /api/auth/session──► verifyIdToken (Admin SDK)
                                           ├─ upsertUser → MongoDB `users`
                                           ├─ createSessionCookie (14d)
                                           └─ Set-Cookie httpOnly; Secure; SameSite=Lax
GET /api/me ◄── session cookie ── verifySessionCookie → fetch user from Mongo
DELETE /api/auth/session → clears cookie (logout)
POST /api/auth/reset-password { email } → Admin SDK generatePasswordResetLink → 200 always
```

Signup/login/forgot run client-side via Firebase SDK (standard for this stack);
the backend only verifies tokens and manages the session + Mongo record.

## Data model — MongoDB `users` collection

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | internal |
| `uid` | string | Firebase UID, **unique index** |
| `email` | string \| null | **unique index** (sparse — X users may lack email) |
| `displayName` | string | from token |
| `photoURL` | string \| null | from token |
| `providers` | string[] | `google` \| `github` \| `twitter` \| `password` |
| `conversionsUsed` | number | default 0; used by later feature |
| `createdAt` | Date | |
| `updatedAt` | Date | |
| `lastLoginAt` | Date | |

Only spec-confirmed fields. No SVG storage, no export history, no presets (explicitly out of v1).

Upsert semantics: match on `uid`; on insert copy provider list + profile; on update
merge `providers` (dedupe, append new provider), refresh profile fields, bump
`lastLoginAt`, `updatedAt`. Never trust client data beyond verified token claims.

## API surface

| Method | Endpoint | Body | Success | Errors |
|---|---|---|---|---|
| POST | `/api/auth/session` | `{ idToken }` | 200 `{ user }` | 400 invalid body, 401 invalid token, 500 |
| DELETE | `/api/auth/session` | — | 204 | 500 |
| GET | `/api/me` | — | 200 `{ user }` | 401 unauthenticated |
| POST | `/api/auth/reset-password` | `{ email }` | 200 `{ ok: true }` | 400 invalid body, 500 |

`user` DTO: `{ uid, email, displayName, photoURL, providers, conversionsUsed, createdAt, lastLoginAt }` — no internal fields.

Reset-password always returns 200 on valid body (no account-existence leak).
Firebase handles the actual reset email (spec copy: "Forgot password?" link).

## Client auth helper (`lib/firebase-client.ts`)

- `initFirebase()` — lazy singleton from `NEXT_PUBLIC_FIREBASE_*` env
- `signUpWithEmail(email, password)` → Firebase `auth/email-already-in-use` mapped to "That email's already registered — log in instead?", `auth/weak-password` → "Use at least 8 characters"
- `signInWithEmail(email, password)` → `auth/invalid-credential` mapped to "That email and password don't match — try again"
- `signInWithGoogle()`, `signInWithX()`, `signInWithGitHub()` — popup
- `resetPassword(email)` — `sendPasswordResetEmail`
- `exchangeIdToken()` — `POST /api/auth/session`, returns `{ user }`
- `signOut()` — Firebase signOut + `DELETE /api/auth/session`
- `getErrorMessage(error)` — shared error→copy mapping

No UI components in this slice (frontend is separate work).

## Environment

`.env.example` (committed), `.env` (gitignored):

```
# Client (NEXT_PUBLIC_* — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server (Admin SDK service account)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database
MONGODB_URI=
```

Manual setup (documented for user, outside code): Firebase project with Google/X/GitHub/Email providers enabled, service account JSON, X developer app (OAuth 1.0a keys; X requires paid tier), Mongo Atlas cluster. `FIREBASE_PRIVATE_KEY` must have literal `\n` escapes or use a JSON string.

## Security

- Session cookie: httpOnly, Secure, SameSite=Lax, Path=/, 14-day lifetime
- All server routes verify via Firebase Admin SDK — never trust client claims
- Zod validation on every request body
- Reset-password endpoint does not reveal whether an email is registered
- No secrets in client bundle; service account stays server-side

## Files

```
lib/firebase-admin.ts        Admin SDK singleton + verify/create cookie helpers
lib/db.ts                    Mongo client singleton + users collection + indexes
lib/auth.ts                  getSessionUser(), upsertUser(), cookie helpers
lib/validation.ts            zod schemas
lib/firebase-client.ts       client SDK init + auth actions + error mapping
app/api/auth/session/route.ts  POST exchange, DELETE logout
app/api/me/route.ts            GET current user
app/api/auth/reset-password/route.ts POST reset email
.env.example
docs/ (this file)
```

## Out of scope (later slices)

- Usage counting + guest limit gating (`conversionsUsed` consumed)
- Login/signup UI, dropdown menus, proxy route guards
- Email verification flows beyond reset
- Export history / saved presets (need roadmap line item)
