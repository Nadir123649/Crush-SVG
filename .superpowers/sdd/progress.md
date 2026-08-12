# SDD Progress Ledger — OAuth v2

Plan: docs/superpowers/plans/2026-08-12-oauth-v2-jwt-sessions.md
Base commit: 31aaa12
Branch: CrushSVG-Backend

Task 1: complete (commits 31aaa12..f1b6b59, review clean; minors: trailing newline, rate-limit map prune, server-only dep needed before vitest touches server-only modules)
Task 2: complete (commits d34d28d..4f1d5a9, review clean; minors: lenient verifyAccessToken id/role coercion, jti '' footgun in buildTokenPayload, env mutation in wrong-secret test, test hardcodes 15m/7d)
Task 3: complete (commits 4f1d5a9..2a86e85, review clean; minors: revokeAllSessions status type widened vs spec (fold into sweep), ObjectId.isValid guard at route layer, test gaps: sort/freshness/foreign-negative/fallback-branch, ensureIndexes module-flag race (harmless)
