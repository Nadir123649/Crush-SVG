# Task 1 Report: Test infra, deps, env, validation schema

## Status: DONE_WITH_CONCERNS

## Path correction
Brief paths `lib/validation.ts` and `lib/rate-limit.ts` map to `src/lib/` in this repo (App Router structure, tsconfig `@/*` → `./src/*`). Files created there; no root `lib/` exists.

## Changes per file

### package.json
- Ran `npm install jsonwebtoken` and `npm install -D vitest @types/jsonwebtoken` (brief step 1). Installed versions verified in package-lock.
- Added script: `"test": "vitest run"` (brief step 2).

### vitest.config.ts (created, repo root)
- Brief step 3 verbatim: `defineConfig` with `@` alias → `path.resolve(__dirname)`, `environment: 'node'`.
- Note: `@` alias points at repo root, but tsconfig maps `@/*` → `./src/*`. Kept verbatim per brief; future tests importing `@/lib/...` under vitest would resolve to root `lib/` which does not exist. Flagged as concern (decode in later tasks).

### .env.example
- Appended JWT block verbatim (brief step 4): `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES=15m`, `REFRESH_TOKEN_EXPIRES=7d` with comment.

### src/lib/validation.ts
- Appended `oauthSchema` verbatim (brief step 5): `{ firebaseToken: z.string().min(1, 'firebaseToken is required'), rememberMe: z.boolean().optional() }`. Existing `sessionSchema` and `resetPasswordSchema` untouched.

### src/lib/rate-limit.ts (created)
- Brief step 6 verbatim: `import 'server-only'`, in-memory `buckets` Map, `checkRateLimit(key, limit, windowMs)` returning `{ allowed, retryAfterSeconds }` with window reset on expiry.

## Verification
`npx vitest run --passWithNoTests` → exit 0, "No test files found" (expected for this task).
Note: vitest printed a Vite warning about ESM syntax in `vitest.config.ts` loaded as CJS — cosmetic, config loader graciously accepts; planned native-loader deprecation. Low concern.

`server-only` package check: NOT installed at top level (only bundled inside `node_modules/next/dist/compiled/server-only`). Next aliases `server-only` at build time, so route code is fine. But if a future vitest unit test imports `@/lib/rate-limit` directly, resolution fails. Flagged for later tasks.

## Self-review notes
- All 5 touched files are exactly the brief's scope; no other files modified (git status shows only expected paths).
- One commit created, message per brief step 8.
- `server-only` dependency intentionally NOT added — brief step 1 specifies only jsonwebtoken, vitest, @types/jsonwebtoken. Concern recorded above.