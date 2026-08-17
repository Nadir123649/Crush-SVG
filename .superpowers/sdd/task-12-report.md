# Task 12 Report — Final sweep (lint, tests, build, smoke)

Date: 2026-08-12 · Branch: CrushSVG-Backend

## Minor-fix batch (TDD where behavior changed: test → fail → fix → green)

| Item | Status | Notes |
|---|---|---|
| A. `revokeAllSessions` status param narrowed | Done | `src/lib/sessions.ts:124` — param now `'logged_out' \| 'revoked'`. Callers verified: logout-all passes `'logged_out'`, sessions DELETE-all passes `'revoked'`. tsc clean. |
| B. Malformed ObjectId → 404 | Done | `src/app/api/v1/sessions/[id]/route.ts` — `ObjectId.isValid(id)` guard returns `404 {error:'Session not found'}` before any side effects. Red/green: new test `returns 404 without side effects when session id is not a valid ObjectId` failed (204→404) before fix, passes after. |
| C. Refresh cookie cleared on revocation | Done | Both routes now `res.cookies.delete(REFRESH_COOKIE_NAME)` (constant reused from `@/lib/auth`). DELETE-all clears unconditionally (parity with logout-all). DELETE-one clears only when `who.user.jti === id` (revoking own session — a different session's revocation must not log the caller out; logout route's `jti`-gated pattern). Tests: `set-cookie` contains `crushsvg_refresh=;` on 204 in both routes; new test `keeps refresh cookie when revoking a different session`; 404 paths assert no set-cookie. |
| D. Dead `getSessionUser` removed | Done | `src/lib/auth.ts` — function removed; unused imports (`NextRequest`, `auth`, `getUsersCollection`) removed; `REFRESH_COOKIE_NAME` + `toUserDTO` kept. `rg`/grep across `src/` confirms zero remaining references. |
| E. tokens.test.ts env restore | Done | Wrong-secret test now restores `JWT_ACCESS_SECRET` in `finally` (original value captured first), so a failing assertion can't leak a mutated env into later tests. |
| F. .gitignore middleware entry | Verified | No `middleware` line exists in `.gitignore` (read full file); the planned exclude was for the original `src/middleware.test.ts` path, which was relocated to `src/lib/auth-middleware.test.ts` — nothing stale, nothing added. |

## Brief step 5 — README stale endpoint docs

`rg -i "api/auth/session|reset-password" README.md AGENTS.md CLAUDE.md` → **zero matches** in all three. Remaining hits are confined to `.superpowers/sdd/` reports and `docs/superpowers/` historical plan/spec files (documentation of the removed v1 routes, intentional history). No README update needed.

## Verification gate

1. **`npm run lint`** — `eslint` exit 0, zero problems.
2. **`npm test`** — 13 files, 80 tests, all pass (includes the 4 new/updated assertions).
3. **`npx tsc --noEmit`** — first run: only pre-existing stale `.next/types` validator errors (referencing routes deleted in Task 8: `app/api/auth/session`, `reset-password`, plus `app/page`/`app/layout` stubs). After `next build` regenerated `.next/types`: **exit 0, clean**.
4. **`npm run build`** — First attempt FAILED at the type-check phase: stale `.next/dev/types/validator.ts` (leftover from an 8/11 dev run, pre-Task-8) referenced deleted routes. Root cause confirmed: `src/app/{page,layout}.tsx` exist; the stale file was the only error source. Cleared `.next` (gitignored, safe) → rebuild **passed**: compiled, TS finished, 9 pages generated, route table shows all 8 v1 endpoints as `ƒ` dynamic. No middleware/proxy convention file exists under `src/` and the build never demanded one — the auth-middleware is an in-route helper, correct per current structure.
5. **Manual smoke (partial)** — `.env` has real Firebase + Mongo values, but **Mongo unreachable** from this machine (`querySrv ECONNREFUSED _mongodb._tcp.cluster0.wmdsycl.mongodb.net`). Ran the subset that fails before DB access, against `next dev --port 3199`:
   - `GET /api/me` (no token) → **401** `{"error":"Unauthorized"}` ✓
   - `POST /api/v1/oauth/google` junk token → **401** `{"error":"Invalid or expired token"}` ✓
   - `POST /api/v1/oauth/google` empty body → **400** `{"error":"Invalid JSON body"}` ✓
   - **Skipped (Mongo needed):** full login with real Firebase idToken, session create/list/revoke round-trips, refresh rotation, provider linking. Documented per dispatch instruction.
6. **README/AGENTS/CLAUDE** — no stale endpoint docs (see above).

## Anything left undone

- Mongo-dependent smoke steps skipped (infra unreachable), not code issues.
- Note for ops: `.next` had stale dev-run type artifacts; any future `tsc --noEmit` after `next dev` runs but before a build may resurface them — clear `.next` and rebuild.
