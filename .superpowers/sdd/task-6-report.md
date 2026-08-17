# Task 6 Report: User cascade (`src/lib/firebase-user.ts`)

## Summary
Implemented the user cascade module: `providerIdToName` and `resolveUserCascade`, with a 4-test Vitest suite. TDD followed: red (module not found) → green (4/4). No other files touched.

## Changes per file

### `src/lib/firebase-user.test.ts` (new)
- Test file per the brief, verbatim except for test-harness fixes (see Deviations).
- Tests: provider id mapping, create-on-new, email-match uid binding, provider dedup on repeat login.

### `src/lib/firebase-user.ts` (new)
- `ProviderName` type: `'google' | 'github' | 'x' | 'password'`.
- `providerIdToName`: maps `google.com/github.com/twitter.com/password`, fallback returns input as-is.
- `resolveUserCascade(token, provider, users?)`:
  1. `findOne({ uid })` → refresh profile (email/displayName/photoURL backfill), `$addToSet` provider, bump `updatedAt`/`lastLoginAt`, `returnDocument: 'after'`.
  2. Else lowercase/trimmed email match → bind firebase uid onto existing doc, backfill profile, `$addToSet` provider.
  3. Else insert new doc (`conversionsUsed: 0`, `providers: [provider]`, timestamps set).
- Deviation from brief's verbatim code: used static `import { ObjectId } from 'mongodb'` (repo convention per `src/lib/db.ts`/`sessions.ts`) instead of the brief's `new (await import('mongodb')).ObjectId()` dynamic import. Identical behavior.

### Not touched (per brief)
- `src/lib/firebase-admin.ts` — `signInProvider` removal deferred to Task 10; `src/lib/auth.ts` still imports it.

## Test output

### Red phase — `npm test -- src/lib/firebase-user.test.ts`
```
FAIL  src/lib/firebase-user.test.ts [ src/lib/firebase-user.test.ts ]
Error: Cannot find package '@/lib/firebase-user' imported from .../firebase-user.test.ts
Test Files  1 failed (1)
```

### Green phase — same command
First attempt: 2 of 4 failed (bind, dedupe) — fake collection in brief's test did not match real mongodb driver v6+ semantics. After fixing the fake: 4/4 pass.
```
Test Files  1 passed (1)
     Tests  4 passed (4)
```

### Full suite — `npm test`
```
Test Files  5 passed (5)
     Tests  26 passed (26)
```

### Lint — `npx eslint src/lib/firebase-user.ts src/lib/firebase-user.test.ts`
Clean (no output).

## Self-review notes
- `resolveUserCascade` uses `findOneAndUpdate` with `returnDocument: 'after'` — matches mongodb driver v7 (package.json `mongodb ^7.5.0`) which returns the document directly (v6+ default).
- Email lookup lowercased/trimmed before match and before insert; stored email stays normalized.
- `$addToSet` keeps provider list deduped on repeat logins.
- Create path inserts a full `UserDoc` (all required fields present, `email: string | null` satisfied).
- No comments in code; single quotes; no semicolons; `server-only` guard and optional `users` param (defaults to `getUsersCollection()`) mirror `src/lib/db.ts` conventions.
- Did not run `next build` (per instructions).

## Deviations from brief
1. **Test fake fixes (3)** — brief's `fakeUsers().findOneAndUpdate` did not model the real driver:
   - Returned `{ value: doc }` while driver v6+/v7 returns the document directly → made bind/dedupe tests fail (`user.uid` undefined, `.providers` undefined).
   - No `_id` matching branch → email-bind update fabricated a new doc instead of updating the matched one.
   - Only handled `$addToSet: { providers: { $each: [...] } }`, not the scalar form (`$addToSet: { providers: 'google' }`) the implementation uses.
   - Removed the dead no-op `$setOnInsert` loop (empty block — would trip `no-empty` lint).
2. **Static `ObjectId` import** in `firebase-user.ts` instead of brief's inline dynamic import (repo style).
No changes to behavior or public API; implementation otherwise verbatim per brief.
