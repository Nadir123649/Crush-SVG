# Task 2 Report: JWT tokens (`src/lib/tokens.ts`)

Status: DONE_WITH_CONCERNS
Commit: `280de70` (branch CrushSVG-Backend)

## Changes per file

### package.json / package-lock.json
- Added `server-only` (0.0.1) as a devDependency via `npm install -D server-only`.
- Rationale: `src/lib/tokens.ts` imports `'server-only'` (Next aliases it internally to an empty module in server contexts; vitest resolves the real npm package).

### src/lib/tokens.test.ts (new)
- Test file written verbatim from brief (4 tests), PLUS one added line: `vi.mock('server-only', () => ({}))` after the vitest import.
- Why: the real `server-only` npm package is a *marker* package — its `index.js` unconditionally throws `"This module cannot be imported from a Client Component module"`. The npm package only exports an empty module under the `react-server` export condition, which Next.js applies internally and vitest does not. So vitest resolves the default condition and the import throws. `vi.mock` (hoisted) replaces it with `{}`, neutralizing the side-effect import in vitest while the source module stays byte-identical to the brief.
- Kept as a stable, tracked fix (test file is committed; a future `vi.mock` removal would break CI without a vitest config alias, which I'm not allowed to touch in this task).

### src/lib/tokens.ts (new)
- Implemented verbatim from the brief: `TokenPair`, `DecodedAccessToken`, `DecodedRefreshToken` interfaces; `ACCESS_EXPIRES`/`REFRESH_EXPIRES` read from env at module load with defaults `15m`/`7d`; `requireSecret` per-call env read; `generateAccessToken`, `generateRefreshToken`, `buildTokenPayload`, `verifyAccessToken`, `verifyRefreshToken`.
- HS256, jti = sessionId, `ver` claim only when tokenVersion !== undefined. Single quotes, no semicolons, no comments — matches src/lib style (cf. auth.ts, rate-limit.ts).

## Red-phase output

Command: `npm test -- src/lib/tokens.test.ts`

```
FAIL  src/lib/tokens.test.ts [ src/lib/tokens.test.ts ]
Error: Cannot find package '@/lib/tokens' imported from .../src/lib/tokens.test.ts
 Test Files  1 failed (1)
```

(as expected — module not found)

Note: a second red run after implementing tokens.ts failed differently — the real `server-only` package threw `This module cannot be imported from a Client Component module`. See concern below; fixed via `vi.mock` in the test.

## Green-phase output

Command: `npm test -- src/lib/tokens.test.ts`

```
Test Files  1 passed (1)
     Tests  4 passed (4)
```

Full suite (`npm test`) also green: 1 file / 4 tests passed.

## Self-review notes

- Source module is byte-identical to the brief spec; no shortcuts taken on claim mapping, expiry constants, or secret handling.
- Secrets read per-call inside `requireSecret` (as brief notes), so the "wrong secret" test and env mutation between `beforeAll` and test bodies behave correctly.
- Deviation from brief: one extra `vi.mock('server-only', () => ({}))` line in the test file, required because the npm `server-only` package throws outside Next.js. Alternative fixes (vitest config alias to `node_modules/server-only/empty.js` or adding `react-server` resolve condition) would have touched `vitest.config.ts`, which is out of scope for this task. Flagging for the orchestrator: consider a vitest config alias in a later task so the mock can be dropped.
- Did NOT run `next build` (per instructions).
- Only the 4 allowed files committed; `git status` clean apart from pre-existing untracked `.superpowers/` directory.
- Known warning (pre-existing, not introduced here): vitest's `configLoader: 'native'` ESM-in-CJS warning for `vitest.config.ts`.
