### Task 12: Final sweep — lint, build, full Postman pass

**Files:**
- All touched files

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors. Fix any style issues found, rerun.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all unit tests pass (tokens, sessions, auth-middleware, firebase-user).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Complete Postman regression (spec §Testing)**

1. idToken via identitytoolkit `signInWithPassword`
2. `POST /api/v1/oauth/password` → 200, cookie set
3. `GET /api/me` Bearer → 200
4. `POST /api/v1/auth/refresh` → 200, rotated cookie; old access token now 401
5. `GET /api/v1/sessions` → 200 list (1 active session)
6. `DELETE /api/v1/sessions` → 204; access token → 401
7. Login again → `DELETE /api/v1/sessions/[id]` → 204 → 401
8. Errors: `oauth/google` with password idToken → 400; unverified email → 403; junk token → 401; missing body → 400; 11 rapid oauth calls → 429
9. Provider linking: login with email → `POST /api/v1/oauth/google` with Google popup token (browser console) → same Mongo user, `providers` = `["password","google"]`

- [ ] **Step 5: Update README if it documents auth endpoints**

Run `rg -i "api/auth/session|reset-password" README.md AGENTS.md CLAUDE.md` — update any stale endpoint docs.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: final auth v2 lint, tests, and docs sweep"
```

---

## Self-Review Notes

- Spec §API surface: all 8 endpoints covered (Task 7 oauth, Task 8 refresh/logout/logout-all, Task 9 sessions ×3, Task 10 /api/me)
- Spec §tokens: Task 2; §sessions collection: Task 3; §auth-middleware: Task 4; §broker: Task 5; §cascade: Task 6; §client: Task 11; §removal: Task 10; §env: Task 1
- Spec out-of-scope items deliberately absent: guest docs, usernames, geo, brute-force (Firebase-owned), verification UI
- Rate limits on 3 routes (oauth/refresh + logout paths left unthrottled — logout/logout-all rely on bearer auth; oauth + refresh throttled per spec)
- Sessions list DTO drops `tokenVersion`/`rotatedAt` (internal), keeps `remember`, `status`


