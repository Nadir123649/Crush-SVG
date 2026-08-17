# CrushSVG OAuth v2 — Full Puzz 11 Parity (JWT Sessions)

Date: 2026-08-12
Branch: `CrushSVG-Backend`
Status: Approved (2026-08-12, after user review of design sections)

## Context

CrushSVG (SVG→PNG converter) shipped an auth v1 slice: Firebase session cookies,
single Mongo `users` collection, 4 endpoints. User now wants **full parity with the
Puzz 11 auth system** (the games project): JWT access/refresh tokens with rotation,
`LoginSession` docs, session management (list/revoke/logout-all), OAuth provider
linking cascade (one account bound to multiple providers), email-verification gate.

Inputs considered:
- Puzz 11 source (`Music/Puzz 11`): `handleOAuth`, `generateTokens`, `LoginSession`,
  `middleware/auth`, `sessions` routes, guest system
- CrushSVG landing copy master doc v4 (`Downloads/CrushSVG_Final_Landing_Page_Copy.docx`)
- CrushSVG Figma design export (`Downloads/Crush Svg.pdf`) — added email-verification gate requirement

## Decisions (confirmed with user 2026-08-12)

| # | Question | Decision |
|---|---|---|
| 1 | Port scope | **Full parity**: JWT tokens + rotation, LoginSession docs, sessions management, linking cascade, rate limits. Replaces Firebase session cookie |
| 2 | Password auth | **Keep Firebase** as credential broker (`sign_in_provider = password`). No bcrypt, no self-hosted reset emails |
| 3 | Guest system | **Deferred** to conversions slice. Landing doc confirms conversion is 100% client-side ("Your SVG never leaves your browser"), so guests have no server data to preserve. Guest counter = localStorage; account counter = `conversionsUsed`. No guest User docs, no `x-guest-id` |
| 4 | API layout | **Mirror Puzz 11 `/api/v1/*`**. Clean break, old `/api/auth/*` routes removed (pre-launch, no users to migrate) |

## Architecture

```
Browser (Firebase JS SDK — popup for Google/GitHub/X, email/password, forgot/reset)
  └─ idToken ──POST /api/v1/oauth/[provider]──► verifyIdToken (Admin SDK)
                                                 ├─ provider mismatch guard (sign_in_provider vs URL)
                                                 ├─ password provider: email_verified gate (403)
                                                 ├─ user cascade: uid → email-bind → create
                                                 ├─ create LoginSession doc (jti)
                                                 └─ Set-Cookie refreshToken (httpOnly; 7d or session)
Protected routes: Authorization: Bearer <accessToken 15m>
  └─ verify JWT (HS256) → session cache (30s TTL) → LoginSession status === active
POST /api/v1/auth/refresh → rotation: tokenVersion++ (atomic, multi-tab race tolerant)
GET /api/me ── bearer ──► current user from Mongo
```

Key invariant (from Puzz 11): both tokens carry `jti` = LoginSession `_id`.
Deleting/revoking the session kills every token it issued, old and new.

## Data model

### `users` (existing collection — near-unchanged)

| Field | Notes |
|---|---|
| `uid` | Firebase UID, unique index (doubles as Puzz 11 `firebaseUid`) |
| `email` | unique sparse index; null for X users |
| `displayName`, `photoURL` | from token |
| `providers` | array, dedupe append. Puzz 11 `linkedProviders` equivalent |
| `conversionsUsed` | default 0; consumed by later slice |
| `createdAt`, `updatedAt`, `lastLoginAt` | |

No username/publicId/password/pendingEmail/verification fields — Firebase owns
credentials; no public profiles in CrushSVG.

### `sessions` (new collection, raw mongodb driver — no mongoose in this project)

| Field | Notes |
|---|---|
| `userId` | ObjectId ref, indexed |
| `provider` | google \| github \| x \| password |
| `remember` | bool, default true; controls cookie duration |
| `tokenVersion` | int, default 0; rotation counter |
| `status` | `active` \| `logged_out` \| `revoked` (no `expired` — TTL covers it) |
| `rotatedAt` | Date \| null |
| `lastSeenAt` | Date, TTL index 7d (auto-expiry) |
| `browser`, `os`, `deviceType` | parsed from user-agent |
| `ip`, `userAgent` | |
| `createdAt` | |

## API surface (final)

| Method | Endpoint | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/v1/oauth/[provider]` | — | `{ firebaseToken, rememberMe? }` | 200 `{ user, token, sessionId }` + cookie | 400 missing/mismatch, 403 email_not_verified, 401 firebase, 429, 404 unknown provider |
| POST | `/api/v1/auth/refresh` | cookie | — | 200 rotated `{ token }` | 200-with-error payload (Puzz 11 style) or 401 session_revoked |
| POST | `/api/v1/auth/logout` | bearer | — | 200 | 401 |
| POST | `/api/v1/auth/logout-all` | bearer | — | 200 | 401 |
| GET | `/api/v1/sessions` | bearer | — | 200 list | 401 |
| DELETE | `/api/v1/sessions` | bearer | — | 204 | 401 |
| DELETE | `/api/v1/sessions/[id]` | bearer | — | 204 | 401, 404 |
| GET | `/api/me` | bearer | — | 200 `{ user }` | 401 |

Provider map: `google.com→google`, `github.com→github`, `twitter.com→x`,
`password→password`. Flow through one catch-all route dispatch (Puzz 11 pattern).

### User resolution cascade (port of Puzz 11 `handleOAuth`)

1. `verifyIdToken(firebaseToken)`
2. Mismatch guard: token `firebase.sign_in_provider` must match URL provider
3. **Password gate**: if provider is `password` and `!token.email_verified` → 403 `email_not_verified` (Figma design requires activation gate)
4. Normalize email lowercase/trim
5. `users.findOne({ uid })` → update profile, `$addToSet` provider, bump lastLoginAt
6. else `users.findOne({ email })` → bind Firebase uid + provider onto existing account (so Google+X+GitHub+password all land on one account)
7. else create new user (uid, email, profile, providers:[provider])
8. Always: dedupe `providers`, refresh profile fields, `lastLoginAt=now` (same semantics as current v1 `upsertUser`, plus email-match binding)

### Tokens (`lib/tokens.ts`)

- Access: HS256, `{ id, role, jti }`, 15m (`JWT_ACCESS_SECRET`, `ACCESS_TOKEN_EXPIRES`)
- Refresh: HS256, `{ id, jti, ver }`, 7d (`JWT_REFRESH_SECRET`, `REFRESH_TOKEN_EXPIRES`)
- `ver` = tokenVersion snapshot; rotation bumps it atomically:
  `sessions.findOneAndUpdate({ _id: jti, tokenVersion: ver, status: "active" }, { $inc: { tokenVersion: 1 }, $set: { rotatedAt } })`
- Miss → if session alive but version stale: re-issue at current version (multi-tab race tolerance, never delete cookie). Session missing/revoked → 401 + delete cookie
- DTO in client response: `{ tokenType: "Bearer", accessToken, accessTokenExpires, refreshToken, refreshTokenExpires }`

### Auth middleware (`lib/auth-middleware.ts`)

- `auth(request)` → `{ user } | { error }`: origin check (GET/HEAD exempt; ALLOWED_ORIGINS = NEXT_PUBLIC_APP_URL + localhost), Bearer parse, HS256 verify, session-cache Map (TTL 30s) with DB fallback, status === `active` + userId match
- `invalidateSessionCache(jti?)` called by logout/logout-all/revoke
- Session-broker (`lib/session-broker.ts`): in-process SSE registry + `publishLogout(userId)` — ported as-is (single-process scope; multi-instance needs Redis, noted)

### Rate limits (in-memory, per Puzz 11)

- oauth: 10/min per provider; refresh: 120/min; logout: 30/min; logout-all: 10/min

## Client changes (`lib/firebase-client.ts`)

- `exchangeIdToken()` → reads `currentUser.providerData[0].providerId`, maps to URL provider, POSTs `/api/v1/oauth/<provider>`, returns `{ user, token }`
- `signOut()` → `DELETE /api/v1/auth/logout` + firebase signOut
- `resendVerificationEmail()` → Firebase `sendEmailVerification()` (no backend endpoint needed)
- Keep: `signUpWithEmail`, `signInWithEmail`, `signInWithGoogle/X/GitHub`, `resetPassword`, `getErrorMessage` + add `email_not_verified` copy mapping ("Please verify your email before logging in")
- `getErrorMessage` gains `auth/too-many-requests` mapping

## Files

```
lib/tokens.ts             JWT sign/verify, buildTokenPayload, secrets guard
lib/sessions.ts           sessions collection, createSession, fingerprint reuse, TTL index
lib/auth-middleware.ts    auth(), session cache, invalidateSessionCache
lib/session-broker.ts     SSE registry, publishLogout
lib/firebase-user.ts      resolveUserCascade(token, provider) → UserDoc
lib/validation.ts         + oauthSchema { firebaseToken, rememberMe? }
app/api/v1/oauth/[[...slug]]/route.ts       POST exchange (dispatch by provider)
app/api/v1/auth/refresh/route.ts
app/api/v1/auth/logout/route.ts
app/api/v1/auth/logout-all/route.ts
app/api/v1/sessions/route.ts                 GET list, DELETE all
app/api/v1/sessions/[id]/route.ts            DELETE revoke one
lib/auth.ts               updated: cookie helpers, getSessionUser → bearer via auth()
app/api/me/route.ts       updated: bearer auth
lib/firebase-client.ts    updated: exchange/signOut/resend/new errors
.env.example              + JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES
```

Removed: `app/api/auth/session/route.ts`, `app/api/auth/reset-password/route.ts`
(reset stays client-side via Firebase `sendPasswordResetEmail`; email templates
customized in Firebase console to match Figma copy — manual console step, not code).

Deps added: `jsonwebtoken`. Deps removed: none.

## Security

- Access/refresh split, short access TTL, rotation on every refresh — replay/leak window minimal
- Session revocation kills all its tokens (jti binding); password change/reset equivalence handled by Firebase
- Origin check on non-GET (CSRF hardening; refresh/logout-all are cookie/bearer)
- Rate limits on every auth route
- No secrets in client bundle; Firebase service account stays server-only
- No brute-force lockout: password verification is client-side against Firebase (design decision — Firebase enforces its own throttling)

## Out of scope (later slices)

- Guest quota gating + localStorage counter, signup/login/verification UI (this slice is backend-only)
- Usage counting endpoint (`conversionsUsed` consumed)
- Export history / saved presets (not roadmap-confirmed)
- Email template hosting (Firebase console customization)
- Multi-instance SSE (Redis pub/sub) — single-process only

## Testing

- `npm run lint`, `npm run build` (typecheck)
- Manual Postman flow: get idToken via
  `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<API_KEY>`
  → `POST /api/v1/oauth/password` → `GET /api/me` → `POST /api/v1/auth/refresh` →
  `GET /api/v1/sessions` → `DELETE /api/v1/sessions/[id]` (expect 401 after) →
  login again → `DELETE /api/v1/sessions` (all) → `POST /api/v1/auth/logout-all`
- Error-path checks: wrong provider in URL vs token, unverified email (403),
  junk firebaseToken (401), missing token (400), rate limit (429)