# Task 13 — Final polish report

Branch: `CrushSVG-Backend` · Base: `2307cf7`

## Items

1. **refresh 429 shape** (`src/app/api/v1/auth/refresh/route.ts`) — now matches oauth 429: `retryAfterSeconds` moved top-level; added `version: '1.0.0'` and `serverTimestamp` per route envelope. TDD: updated 429 test first (watched it fail on missing `version`), then fixed route (watched green). Test now asserts top-level `body.retryAfterSeconds`, `body.version`, `body.serverTimestamp`.
2. **cookie name constant** (`src/app/api/v1/oauth/[[...slug]]/route.ts:105`) — `'crushsvg_refresh'` literal → `REFRESH_COOKIE_NAME` from `@/lib/auth` (import merged with existing `toUserDTO`). Test mock updated for parity.
3. **dead schemas** (`src/lib/validation.ts`) — removed `sessionSchema` and `resetPasswordSchema`. Grep confirmed zero consumers (only self-references). No test file covered them (`validation.test.ts` does not exist; no test references either schema). `z` import retained — still used by `oauthSchema`.
4. **.env.example** — added `NEXT_PUBLIC_APP_URL=` to the client var group (after `NEXT_PUBLIC_FIREBASE_APP_ID`, before server section). Used by `src/lib/auth-middleware.ts:20`.

## Verification

- `npm run lint` → 0 errors
- `npm test` → 80 passed (13 files)
- `npx tsc --noEmit` → exit 0 (no stale `.next` issues)

## Concerns

- None. Diff is 6 files / +14 −13, scoped to the 4 items.
