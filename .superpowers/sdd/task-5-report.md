# Task 5 Report: SSE session broker

**Status:** DONE
**Commit:** 70a8535 (`feat: SSE logout session broker`)
**Date:** 2026-08-12

## What changed per file

### `src/lib/session-broker.ts` (new)
- Created verbatim per brief: `import 'server-only'`, `SseController` interface, module-level `Map<string, Set<SseController>>`, and `subscribe` / `unsubscribe` / `publishLogout` functions.
- `publishLogout` enqueues `'data: logout\n\n'`, closes every controller, deletes the entry, returns subscriber count.
- Style matched repo conventions (single quotes, no semicolons, no comments) — consistent with `src/lib/tokens.ts`.

### `src/lib/session-broker.test.ts` (new)
- Not in the brief (brief only has the module + build check); added to follow the TDD requirement from the orchestrator.
- 6 vitest cases: logout frame + close + count, count-after-publish is 0, unsubscribe drops empty entries, unsubscribe removes only the given controller, empty-publish returns 0, per-user isolation, resubscribe-after-logout.
- Uses a fake `SseController` with a `closed` getter so state mutation via `close()` is observable.

## Red phase

`npm test -- src/lib/session-broker.test.ts` (test written first):

```
 FAIL  src/lib/session-broker.test.ts
Error: Cannot find package '@/lib/session-broker' imported from .../src/lib/session-broker.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

Failed as expected — module did not exist yet.

## Green phase

After implementing `session-broker.ts`:

```
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

First green run had 3 failures — all `expect(controller.closed).toBe(true)` assertions. Root cause was a bug in the test fake: the `closed` boolean was captured by value in the object literal, so mutations inside `close()` were invisible. Fixed the fake to expose `closed` via a getter; implementation untouched. Full suite after fix: **4 test files, 22 tests, all passing**. `npx eslint` on both new files: clean.

## Self-review notes

- Module is a plain in-memory singleton, not exported for injection; consumers get the live singleton, which is what the logout flow needs (same process, same module instance). Fine as-is.
- Iterating a `Set` while calling `close()` is safe — `close()` on a real SSE controller doesn't touch the subscriber map; `unsubscribe` during iteration would still be safe because `set.delete` during `Set` iteration is allowed.
- Edge case: double-subscribing the same controller to the same user is idempotent (Set). Double `publishLogout` returns 0 second time (verified by test).
- Test fake's `enqueue` and `close` are `vi.fn`s; assertions used side-effect arrays + getter rather than call assertions, keeping fakes minimal.

## Deviations from brief

1. **Test file added** (`src/lib/session-broker.test.ts`) — brief Step 2 claimed "no test infra for Next-specific types here" and skipped tests; orchestrator instructions required TDD red/green via `npm test`. Module code matches the brief verbatim.
2. **`next build` skipped** — brief Step 2 asked to run `npx next build`; orchestrator explicitly instructed **do not run `next build`**. Build verification skipped by instruction; `vitest` + `eslint` used instead. The module is pure TS with no Next-specific APIs, so build risk is minimal (Node runtime default per Task 4 review, no Edge/runtime concern).
3. **Commit includes test file** in addition to the module (deviation from brief's `git add src/lib/session-broker.ts`), matching orchestrator TDD instruction.
