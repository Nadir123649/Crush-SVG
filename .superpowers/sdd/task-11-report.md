# Task 11 Report — Client helpers (`src/lib/firebase-client.ts`)

## Status: DONE

## What changed

### `src/lib/firebase-client.ts` (modified)
- Added `sendEmailVerification` import from `firebase/auth`.
- Added `PROVIDER_URL_MAP` (`google.com` → `google`, `github.com` → `github`, `twitter.com` → `x`, `password` → `password`).
- Rewrote `SessionResponse` interface: now includes `token: { tokenType, accessToken, accessTokenExpires, refreshToken, refreshTokenExpires }` per brief (previously user-only). `sessionId` returned by server is intentionally not in the interface (brief's shape omits it; extra JSON keys pass through).
- Rewrote `exchangeIdToken(rememberMe = true)`:
  - Reads `getFirebaseAuth().currentUser`; throws `'Not signed in'` if absent.
  - Detects provider via `providerData[0]?.providerId ?? 'password'`, maps through `PROVIDER_URL_MAP` with `'password'` fallback.
  - POSTs `/api/v1/oauth/<provider>` with `{ firebaseToken: idToken, rememberMe }`.
  - 403 → throws `Error('email_not_verified')`; non-ok → `Error('Failed to create session')`.
  - **Extension beyond brief's sample code:** 429 → throws `Error('auth/too-many-requests')`. Without this the brief's `getErrorMessage` case for 429 ("429 → same message") could never surface. Route-level rate limiting (verified in `oauth/[[...slug]]/route.test.ts`) returns 429; this bridges it to the friendly message.
- Added `resendVerificationEmail()`: throws `'Not signed in'` if no current user, else `sendEmailVerification(currentUser)`.
- Rewrote `signOut()`: `fetch('/api/v1/auth/logout', { method: 'POST' })` then firebase `signOut`. (Brief prose said DELETE but the brief's code sample and the actual route — `src/app/api/v1/auth/logout/route.ts` has POST only — both use POST; followed the code sample/route.)
- `getErrorMessage`: now keys the switch on `code || message` (AuthError keeps `code`-based behavior; the new custom errors thrown by `exchangeIdToken` carry the code as their `message`). Added cases `email_not_verified` → "Please verify your email before logging in" and `auth/too-many-requests` → "Too many attempts — wait a bit and try again".

### `src/lib/firebase-client.test.ts` (new)
15 tests covering:
- `exchangeIdToken`: correct endpoint per provider (google/github/x), rememberMe true default + false passthrough, password fallback with empty `providerData`, not-signed-in throw, 403 → `email_not_verified`, 429 → `auth/too-many-requests`, generic 500 → `Failed to create session`.
- `signOut`: POST to `/api/v1/auth/logout` then firebase signOut.
- `resendVerificationEmail`: calls `sendEmailVerification(currentUser)`, throws when not signed in.
- `getErrorMessage`: both new cases (via `Error` message), existing firebase code mapping preserved, default fallback.

Mocks: full `vi.mock` of `firebase/app` + `firebase/auth` (node environment kept — vitest.config.ts uses `environment: 'node'`; module-under-test never loads real SDK in tests). `getAuth` is mocked with a live getter over a hoisted mutable `currentUser` because `getFirebaseAuth()` caches the first `getAuth` return at module scope (see self-review).

## Red phase

First run (`npx vitest run src/lib/firebase-client.test.ts`): 15 tests, 12 failed, 3 passed (pre-existing getErrorMessage mappings). Failures confirmed old behavior:
- fetch hit `/api/auth/session` with `{ idToken }` instead of `/api/v1/oauth/<provider>` with `{ firebaseToken, rememberMe }`
- `signOut` sent DELETE `/api/auth/session` instead of POST `/api/v1/auth/logout`
- `resendVerificationEmail` not exported (`is not a function`)
- `getErrorMessage` returned default for both new codes

## Green phase

`npm test` (full suite): Test Files 13 passed (13), Tests 78 passed (78). Zero failures.
`npx tsc --noEmit`: only pre-existing errors in generated `.next/dev/types/validator.ts` / `.next/types/validator.ts` (stale stubs referencing routes removed in Task 8 — `app/api/auth/session`, `app/page`, `app/layout`). No errors in `src`. Did not touch `.next`.
`npx eslint src/lib/firebase-client.ts src/lib/firebase-client.test.ts`: clean.

## Self-review notes

- **Module-level auth cache in `getFirebaseAuth()`** (`if (auth) return auth`): the first `getAuth` result is cached for the module's lifetime. Tests initially failed with stale `currentUser` across tests because per-test `mockReturnValue` objects were frozen into the cache. Fixed by mocking `getAuth` with an implementation returning `{ get currentUser() { return mocks.currentUser } }` (live getter over hoisted state) + resetting `mocks.currentUser = null` in `beforeEach`. This mirrors real browser behavior where `currentUser` mutates on the same auth instance.
- **`getErrorMessage` reads `message` too** (`switch (code || message)`): necessary because the new error paths throw plain `Error`s whose message equals the code. AuthError inputs (firebase) are unaffected — `code` takes precedence. Edge case: a firebase AuthError whose `message` coincidentally equals a case key while `code` is something else would mis-map — no such pairing exists with the current cases.
- Followed repo conventions: single quotes, no semicolons, no comments, `@/` alias, `vi.hoisted` mock pattern (matches `oauth/[[...slug]]/route.test.ts`).
- Did not run `next build` (per instructions).
- Only touched the two named files + new test file.

## Deviations from brief

1. **429 → `auth/too-many-requests` throw added** in `exchangeIdToken` (not in brief's code sample) — required to make the brief's `getErrorMessage` "429 → same message" requirement functional; routes verified to return 429 under rate limit.
2. **`signOut` uses POST** `/api/v1/auth/logout` (brief prose said DELETE; code sample and the existing route use POST) — followed the code sample and route contract.
3. **`getErrorMessage` switched on `code || message`** (brief only showed adding cases to the existing switch) — needed for the new plain-Error codes to be reachable.
4. **`SessionResponse` kept inline in firebase-client.ts** (brief's sample code) rather than importing a shared `TokenPair` type — no shared type exists in the repo yet.

## Commit

`0935bad` — "feat: client auth helpers for OAuth exchange, logout-all, resend verification" (2 files: firebase-client.ts modified, firebase-client.test.ts added)
