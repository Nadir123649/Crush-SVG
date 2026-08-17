### Task 1: Test infra, deps, env, validation schema

**Files:**
- Modify: `package.json` (deps + test script)
- Create: `vitest.config.ts`
- Modify: `.env.example`
- Modify: `lib/validation.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `oauthSchema` zod schema `{ firebaseToken: z.string().min(1), rememberMe: z.boolean().optional() }`; vitest runnable via `npm test`

- [ ] **Step 1: Install deps**

Run:
```bash
npm install jsonwebtoken
npm install -D vitest @types/jsonwebtoken
```

- [ ] **Step 2: Add test script to package.json**

Modify `package.json` scripts:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Update .env.example**

Append to `.env.example`:
```
# JWT session tokens (server — generate strong random values, e.g. `openssl rand -base64 48`)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

- [ ] **Step 5: Extend lib/validation.ts**

Append:
```ts
export const oauthSchema = z.object({
  firebaseToken: z.string().min(1, 'firebaseToken is required'),
  rememberMe: z.boolean().optional(),
})
```

- [ ] **Step 6: Create lib/rate-limit.ts** (shared by oauth + refresh routes)

```ts
import 'server-only'

const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }
  bucket.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}
```

- [ ] **Step 7: Verify**

Run: `npx vitest run --passWithNoTests`
Expected: exit 0, "No test files found" is fine.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.example lib/validation.ts lib/rate-limit.ts
git commit -m "chore: add vitest, jwt deps, oauth schema, rate limiter, env vars"
```

---

