### Task 5: SSE session broker (`src/lib/session-broker.ts`)

**Files:**
- Create: `src/lib/session-broker.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface SseController { enqueue(chunk: string): boolean; close(): void }`
  - `subscribe(userId: string, controller: SseController): void`
  - `unsubscribe(userId: string, controller: SseController): void`
  - `publishLogout(userId: string): number` — enqueues `data: logout\n\n` to every live controller, closes them, deletes the entry; returns subscriber count

- [ ] **Step 1: Write src/lib/session-broker.ts**

```ts
import 'server-only'

export interface SseController {
  enqueue(chunk: string): boolean
  close(): void
}

type ControllerSet = Set<SseController>

const subscribers = new Map<string, ControllerSet>()

export function subscribe(userId: string, controller: SseController): void {
  let set = subscribers.get(userId)
  if (!set) {
    set = new Set()
    subscribers.set(userId, set)
  }
  set.add(controller)
}

export function unsubscribe(userId: string, controller: SseController): void {
  const set = subscribers.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) subscribers.delete(userId)
}

export function publishLogout(userId: string): number {
  const set = subscribers.get(userId)
  if (!set) return 0
  const count = set.size
  for (const controller of set) {
    controller.enqueue('data: logout\n\n')
    controller.close()
  }
  subscribers.delete(userId)
  return count
}
```

- [ ] **Step 2: Verify build still passes (no test infra for Next-specific types here)**

Run: `npx next build 2>&1 | Select-String -Pattern "error|warn"` — expected: no errors (build may warn about other things; that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/lib/session-broker.ts
git commit -m "feat: SSE logout session broker"
```

---

