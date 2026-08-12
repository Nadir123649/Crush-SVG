# Task 7a Fixes Report — OAuth v2 review findings

Branch: CrushSVG-Backend

## FIX 1 — Security: unverified-email cascade merge

- `src/lib/firebase-user.ts`: email-match branch now gated on `token.email_verified === true`. Unverified email falls through to create path (fresh account, no rebind). Uid branch and email backfill on uid branch unchanged.
- `src/lib/firebase-user.test.ts`: new test `does not bind an unverified email onto an existing user` (red first, failed on leaked `password` provider, then green after gate). Existing positive bind test updated to pass `email_verified: true`.
- TDD: red confirmed (1 failed / 4 passed), green after gate.

## FIX 2 — Flaky rate-limit test

- `src/app/api/v1/oauth/[[...slug]]/route.test.ts`: `beforeEach` now sets `mocks.verifyIdToken.mockResolvedValue(passwordToken(true))`. Previously the test passed only via cross-test leakage (`vi.clearAllMocks()` clears calls, not implementations).
- Flakiness demonstrated: isolated run of `429 after 10` failed (401 instead of 400) before the fix; passes in isolation after.
- Assertions unchanged: 10x 400, then 429 with `retryAfterSeconds > 0`.

## Verification

- `npx vitest run`: 6 files, 36 tests, all green.
- `npx tsc --noEmit`: only stale `.next/types` errors (ignored per brief).
- `npm run lint`: clean.
- Route tests untouched behavior-wise; full suite confirms no breakage from Fix 1.

## Commits

- `3777202` fix: gate email cascade merge on verified email
- `0827674` fix: seed verifyIdToken mock for stable rate-limit test

## Concerns

- Route-level flow (route.ts:286) still enforces its own password-provider `email_verified` gate; social-provider flow now relies solely on this library gate — caller (`oauth` route) treats no-match as create flow, which is the intended behavior.
