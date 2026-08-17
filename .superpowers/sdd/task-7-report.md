# Task 7 Report: OAuth exchange route (`app/api/v1/oauth/[[...slug]]/route.ts`)

## Status: DONE

Commit: `6c417b6` — `feat: OAuth exchange route with provider linking and session issue`

## Changes per file

### `src/app/api/v1/oauth/[[...slug]]/route.ts` (created)
Route copied verbatim from brief:
- `runtime = 'nodejs'`
- `PROVIDER_URL_MAP`: google→google.com, github→github.com, x→twitter.com, password→password
- Unknown provider → 404 (checked before rate limit, per brief order)
- Rate limit `oauth:<provider>` 10/min via existing `checkRateLimit` from `@/lib/rate-limit` → 429 with `retryAfterSeconds`
- Invalid JSON body → 400; `oauthSchema.safeParse` failure → 400 with `fieldErrors`
- `verifyIdToken` (from `@/lib/firebase-admin`) → provider mismatch → 400 `Provider mismatch`
- `provider === 'password' && !token.email_verified` → 403 `email_not_verified`
- `providerIdToName` + `resolveUserCascade` (`@/lib/firebase-user`) → user
- `getSessionsCollection` + `createSession` (`@/lib/sessions`) → session
- `buildTokenPayload` (`@/lib/tokens`) with `{ id: user._id, role: 'free', sessionId, tokenVersion }`
- 200 `{ user: toUserDTO(user), token: tokenPair, sessionId }`
- Refresh cookie set inline (brief: `setRefreshCookie` lands in Task 8; name `crushsvg_refresh` hardcoded per brief): httpOnly, secure in production, sameSite lax, path `/`, maxAge 7d when remember else undefined
- Catch-all → 401 `Invalid or expired token` + console.error

### `src/app/api/v1/oauth/[[...slug]]/route.test.ts` (created, TDD)
Vitest suite mocking `@/lib/firebase-admin`, `@/lib/firebase-user`, `@/lib/sessions`, `@/lib/tokens`, `@/lib/auth` via `vi.hoisted`; real `@/lib/rate-limit` + `@/lib/validation`; real `next/server` `NextRequest`/`NextResponse` for full request/response exercising (proved practical — no logic-only fallback needed). 9 tests:
1. unknown provider → 404
2. invalid JSON body → 400
3. missing firebaseToken → 400 fieldErrors
4. provider mismatch (password token on /google) → 400
5. password provider, unverified email → 403 `email_not_verified`
6. verifyIdToken rejects → 401
7. happy path → 200 body `{user, token, sessionId}`, cookie `crushsvg_refresh` value + httpOnly, asserts `createSession`/`buildTokenPayload` call args, `providerIdToName` called with `'password'`
8. rememberMe:false → `createSession` called with `remember: false`
9. rate limit: 10 allowed (400s from schema), 11th → 429 with `retryAfterSeconds > 0` (uses `github` key — isolated from other tests' buckets)

## Red phase
`npm test`:
```
FAIL  src/app/api/v1/oauth/[[...slug]]/route.test.ts
Error: Cannot find module '/src/app/api/v1/oauth/[[...slug]]/route'
 6 passed suites, 1 failed (route module absent)
```
Expected failure — route did not exist.

## Green phase
`npm test`:
```
Test Files  6 passed (6)
     Tests  35 passed (35)
```
(26 pre-existing + 9 new.)

## Additional verification
- `npx tsc --noEmit`: only pre-existing errors in generated `.next/*/types/validator.ts` (stale generated stubs, unrelated to this change). New files type-clean.
- `npx eslint` on both new files: clean.
- `next build` NOT run (per task instructions).

## Self-review notes
- Followed existing conventions: single quotes, no semicolons, no comments, `NextResponse.json` error shape matching `src/app/api/auth/session/route.ts`.
- All dependencies consumed via existing exports; nothing re-implemented.
- Rate limiter state is module-level and shared; test 9 uses the `github` bucket, which no other test touches, avoiding cross-test interference. Tests within the file run sequentially (vitest default) so the 11-request sequence is deterministic.
- Brief's listed "503 firebase not configured" outcome cannot materialize from the brief's own code: `getFirebaseApp()` throw inside `verifyIdToken` lands in the catch-all → 401. Implemented exactly as brief's code block; noted as a brief inconsistency, not a deviation.
- `x` (twitter) provider: no dedicated test (google covers mismatch path); provider map is verbatim per brief.
- Manual smoke check (Postman + Mongo) not performed — requires `.env` + running Mongo (Task 1 env also lacks GOOGLE_* keys; those are Task 8 PKCE scope, not consumed here).

## Deviations from brief
None. Code block implemented verbatim; only addition is the TDD test file (required by task instructions).
