# SDD Progress Ledger — OAuth v2

Plan: docs/superpowers/plans/2026-08-12-oauth-v2-jwt-sessions.md
Base commit: 31aaa12
Branch: CrushSVG-Backend

Task 1: complete (commits 31aaa12..f1b6b59, review clean; minors: trailing newline, rate-limit map prune, server-only dep needed before vitest touches server-only modules)
Task 2: complete (commits d34d28d..4f1d5a9, review clean; minors: lenient verifyAccessToken id/role coercion, jti '' footgun in buildTokenPayload, env mutation in wrong-secret test, test hardcodes 15m/7d)
Task 3: complete (commits 4f1d5a9..2a86e85, review clean; minors: revokeAllSessions status type widened vs spec (fold into sweep), ObjectId.isValid guard at route layer, test gaps: sort/freshness/foreign-negative/fallback-branch, ensureIndexes module-flag race (harmless)
Task 4: complete (6fcd3a0 + b13cc8b relocation to src/lib/auth-middleware.ts; verified Next 16: middleware.ts deprecated -> proxy.js (file+fn rename), Node runtime default, no runtime config option in proxy files; fixed case-sensitive Bearer; minors: origin startsWith suffix bypass (plan-accepted), in-memory cache per-instance, mongo 500 not 502)
Task 5: complete (70a8535, review clean; note for wiring: SSE route must unsubscribe on close/error, broker does not auto-remove)
Task 6: complete (a2bc7ab, review clean; notes for routes: non-atomic findOne->findOneAndUpdate (E11000 possible), uid-refresh branch stores raw token.email (normalize at route or Task 12), Task 10 must DTO-map UserDoc before API responses)
Task 7: complete (6c417b6 + 3777202 email_verified gate + 0827674 rate-limit test seed; review: Important findings fixed; residual brief-inherent: refresh token in body (XSS exposure vs httpOnly cookie) + catch-all 401 collapse — plan-author decisions for final report)
Task 8: complete (8a78b89, review clean; backlog: no refresh-replay detection (brief design, rate-limited), logout CSRF cookie-delete unauthenticated (brief-verbatim, flag final review), /api/me broken until Task 10 (expected)
Task 9: complete (2b8eb84, review clean; minors for sweep: ObjectId.isValid 404 guard in DELETE /sessions/[id], refresh-cookie clear parity on revoke/revoke-all, publishLogout broadcasts to all user SSE (product note), revokeAllSessions type narrowing)
Task 10: complete (6cf9bbf, review clean; sweep: remove dead getSessionUser + unused imports in src/lib/auth.ts)
Task 11: complete (0935bad, review clean; deviations approved: 429 throw, signOut POST vs stale brief prose, code||message switch)
