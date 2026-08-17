# Task 4 Report: Auth middleware + session cache

Commit: `6fcd3a0` — `feat: auth middleware with bearer verify and session cache` (branch `CrushSVG-Backend`)

## Files changed

### `src/middleware.ts` (new)
- `import 'server-only'` guard, matching `src/lib/tokens.ts` / `src/lib/sessions.ts` style.
- `interface AuthUser { id: string; role: string; jti?: string }` (exported).
- `SESSION_CACHE_TTL_MS = 30_000` and a module-level `Map<string, { valid, expiresAt }>`.
- `allowedOrigins()` — `NEXT_PUBLIC_APP_URL` + `http://localhost:3000` fallback, null-filtered.
- `isMethodExempt(request)` — GET/HEAD/OPTIONS bypass origin checks.
- `isAllowedOrigin(request)` — Origin header, Referer fallback, `startsWith` match.
- `invalidateSessionCache(jti?)` — delete single jti or clear all.
- `auth(request)` — origin gate (403 `Forbidden origin`) → Bearer header check (401) → `verifyAccessToken` from `@/lib/tokens` (401 on failure) → session cache check / DB lookup via `getSessionsCollection()` from `@/lib/sessions` (401 `Session revoked` when `session.userId` mismatches or `status !== 'active'`) → `{ user }` built from token claims.
- Deviations from brief's reference code, all intentional:
  - Direct `import { ObjectId } from 'mongodb'` instead of brief's `new (await import('mongodb')).ObjectId(...)` — matches `src/lib/sessions.ts` convention.
  - No type assertions: imported `type DecodedAccessToken` from `@/lib/tokens` and typed `let decoded: DecodedAccessToken` — per dispatch NOTE, `verifyAccessToken`'s own return type provides the narrowing, no scaffolding assertion needed. `AuthUser` derived directly from decoded claims.
- Return type `Promise<{ user: AuthUser } | { error: Response }>` — `NextResponse.json()` is a `Response` subclass, assignable.

### `src/middleware.test.ts` (new)
- Brief's test verbatim, imports adjusted from `@/lib/auth-middleware` to `@/middleware` (file lives at src root per dispatch, not src/lib).
- 4 tests: same-origin POST allowed, cross-origin POST rejected, GET exempt, `invalidateSessionCache` no-throw.

### Untouched
- `.gitignore` — left untouched, as instructed (see required line below).
- All other files untouched. `next build` not run.

## Red phase

`npm test -- src/middleware.test.ts` before implementation:

```
 FAIL  src/middleware.test.ts [ src/middleware.test.ts ]
Error: Cannot find package '@/middleware' imported from C:/Users/Hassan Irfan/Pictures/Crush-SVG/src/middleware.test.ts
 ❯ src/middleware.test.ts:4:1
 Test Files  1 failed (1)
      Tests  no tests
```
FAIL as expected (module not found).

## Green phase

`npm test -- src/middleware.test.ts` after implementation:

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```
4/4 PASS.

Full suite `npm test`: 3 test files, 16/16 PASS. `npx eslint src/middleware.ts src/middleware.test.ts`: clean.

## Self-review

- Style matches repo: single quotes, no semicolons, no comments, `server-only` guard, `@/` alias imports.
- `server-only` resolves via vitest alias (`vitest.config.ts` → `node_modules/server-only/empty.js`).
- Typecheck (`npx tsc --noEmit`): only errors are pre-existing stale generated files `.next/types/validator.ts` + `.next/dev/types/validator.ts` referencing pre-restructure app routes (`../../../app/page.js` etc.) — unrelated to this task; nothing in `src/middleware*`.
- DB path (jti present) intentionally not unit-tested — requires MongoDB; covered by Postman per brief Step 1.
- Logout/revoke routes will call `invalidateSessionCache(jti)`; cache is module-local, TTL 30s — bounded staleness after revocation.

## Concerns / follow-ups for wiring task (Task 5+)

1. **Next.js 16 deprecates `middleware.ts`**: per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`, the middleware file convention was renamed to `proxy.js` in Next 16. The wiring task should consider `src/proxy.ts` (or accept the deprecation warning). `src/middleware.ts` as created here still functions, but Next 16.3.0 flags it.
2. **Runtime compatibility**: `auth()` imports `jsonwebtoken` (via `@/lib/tokens`) and `mongodb` (via `@/lib/sessions`) — not Edge-runtime safe. The future wiring task must set Node.js runtime (e.g. `runtime: 'nodejs'` proxy config) or call `auth()` from route handlers instead of a middleware/proxy edge function.
3. `src/middleware.ts` currently exports no default/middleware export — it is a helper module, not a runnable proxy. The wiring task must add the actual matcher/export.

## Required .gitignore line (future task must add)

```
src/middleware.test.ts
```

Add this exclusion line (in the `# testing` section) so the test file is not picked up alongside the Next.js middleware convention file. Not committed with this task, per instructions.
