# Mongoose Migration — Design

**Date:** 2026-08-13
**Status:** Approved

## Problem

The project talks to MongoDB exclusively through the raw `mongodb` driver:
`MongoClient` singleton in `src/lib/db.ts`, hand-rolled `Collection<T>` helpers
in `src/lib/sessions.ts` and `src/lib/guest-usage.ts`, manual index creation,
and `ObjectId` casts scattered across ~20 route files. `mongoose@9.9.2` is
already installed but unused. The user wants mongoose to be the single DB
layer.

## Scope

Full migration: replace every source import of the raw driver with mongoose.
3 collections — `users`, `sessions`, `guest_usage` — become models. 14 route
files, 8 test files, and 5 lib files get converted.

## Architecture

### Connection layer — `src/lib/db.ts` (rewrite)

- mongoose singleton cached on `globalThis` (same pattern as today, Next dev
  hot-reload safe).
- `connectToDatabase()` — lazy connect on first use, logs success/failure,
  `serverSelectionTimeoutMS: 5000`.
- Reads `MONGODB_URI` (required, throws if missing) and `MONGODB_DB_NAME`
  (default `crushsvg`).
- DNS workaround: if `DNS_SERVERS` env var present, call `dns.setServers(...)`
  before connecting (Windows `querySrv ECONNREFUSED` workaround already in
  `.env`).
- Exports models: `User`, `Session`, `GuestUsage` (named exports to minimize
  route churn).
- No more `getMongoClient`, `getUsersCollection`, `getSessionsCollection`,
  `getGuestUsageCollection` — all callers convert to the models.

### Models — `src/lib/models/`

Three schema files plus an index barrel.

**User** (`user.ts`)
- `uid: string` — unique index
- `email: string | null` — sparse unique index
- `displayName: string`
- `name?: string | null`
- `photoURL: string | null`
- `providers: string[]`
- `linkedProviders?: string[]`
- `password?: string` — `select: false`
- `isVerified?: boolean`
- `emailVerificationToken?`, `emailVerificationTokenExpire?: number`
- `resetPasswordToken?`, `resetPasswordTokenExpire?: number`
- `conversionsUsed: number` — default 0
- `lastLoginAt: Date`
- `timestamps: true` (`createdAt`, `updatedAt`)

**Session** (`session.ts`)
- `userId: ObjectId` — ref `User`, indexed
- `provider: string`
- `remember: boolean`
- `tokenVersion: number` — default 0
- `status: 'active' | 'logged_out' | 'revoked'`
- `rotatedAt: Date | null`
- `lastSeenAt: Date`
- `browser?`, `os?`, `deviceType?`, `ip?`, `userAgent?`
- `timestamps: true`
- Indexes: `{ userId: 1 }`, `{ userId, deviceType, browser, os }`,
  TTL `{ lastSeenAt: 1 }` expireAfterSeconds 7 days

**GuestUsage** (`guest-usage.ts`)
- custom `_id: string` (guestId)
- `conversionsUsed: number`
- `timestamps: true`
- TTL index `{ updatedAt: 1 }` expireAfterSeconds 30 days

Indexes map 1:1 onto today's manual `createIndex` calls. No data migration:
schemas match existing doc shapes.

## Helper rewrites

Public function names preserved where possible; the `Collection` parameter is
dropped — helpers use the model directly.

**`src/lib/sessions.ts`** — all 7 helpers to mongoose:
- `createSession` — fingerprint lookup + upsert-style `findOneAndUpdate`
  (existing doc: refresh `provider/remember/createdAt/lastSeenAt/ip/userAgent`)
  else create with `tokenVersion: 0`, `status: 'active'`
- `listActiveSessions(userId)` — `find({ userId, status: 'active' })` sorted
  `lastSeenAt: -1`
- `revokeSession(sessionId, userId)` — `updateOne({ _id, userId },
  { status: 'revoked' })`, return `modifiedCount > 0`
- `revokeAllSessions(userId, status)` — `updateMany({ userId, status: 'active' })`
- `getSessionTokenVersion(sessionId)` — `findById`, default 0
- `getSessionRemember(sessionId)` — `findById`, default true
- `rotateSession(sessionId, expectedVersion, userId)` — atomic
  `findOneAndUpdate` with tokenVersion guard + fallback read, same return
  shape `{ rotated, currentVersion, remember }`

**`src/lib/guest-usage.ts`**
- `getGuestUsage(guestId)` — `findById`, default 0
- `incrementGuestUsage(guestId)` — `findOneAndUpdate` upsert with
  `$inc: { conversionsUsed: 1 }`, `$setOnInsert`, `$set: { updatedAt }`,
  same semantics as today

**`src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/lib/firebase-user.ts`,
`src/lib/auth-middleware.ts`**
- `getUsersCollection()` → `User` model
- `new (await import('mongodb')).ObjectId(x)` casts → mongoose auto-casting or
  `findById(x)`

## Route conversion

14 route files:

- `src/app/api/me/route.ts`
- `src/app/api/v1/health/route.ts` — `getMongoClient()` → connection ping via
  `connectToDatabase()`
- `src/app/api/v1/admin/users/route.ts`
- `src/app/api/v1/auth/{register,refresh,logout,logout-all,change-password}/route.ts`
- `src/app/api/v1/auth/login/route.ts`
- `src/app/api/v1/conversions/route.ts`
- `src/app/api/v1/passwords/{forgot,reset}/route.ts`
- `src/app/api/v1/profile/route.ts`
- `src/app/api/v1/sessions/route.ts`, `src/app/api/v1/sessions/[id]/route.ts`
- `src/app/api/v1/usage/route.ts`
- `src/app/api/v1/oauth/[[...slug]]/route.ts`
- `src/app/api/v1/verification/email/resend/route.ts`

Patterns:
- `getUsersCollection()` + `findOne({ _id: new ObjectId(id) })` →
  `User.findById(id)` (mongoose casts strings natively)
- `new ObjectId(sessionId)` comparisons → `_id` query casts or `.equals()`
- Dynamic `import('mongodb')` ObjectId usages removed

## Test updates

8 test files mock the lib layer via `vi.mock`:

- `src/app/api/me/route.test.ts`
- `src/app/api/v1/auth/{refresh,logout,logout-all}/route.test.ts`
- `src/app/api/v1/sessions/route.test.ts`, `sessions/[id]/route.test.ts`
- `src/lib/sessions.test.ts`, `src/lib/firebase-user.test.ts`

Strategy: mock the exported model names (e.g. `vi.mock('@/lib/db', () => ({
 User: mocks.User }))`) and re-shape helper stubs (`usersFindOne` →
`User.findById` etc.). `ObjectId` expectations become mongoose
`Types.ObjectId` or string-form assertions. Behavior assertions unchanged.

## Env

`.env`:
- `MONGODB_URI=mongodb+srv://holapushpush_db_user:PzCOwkBLf1W7YNIF@crushsvg.cfpuwzi.mongodb.net/`
- `MONGODB_DB_NAME=crushsvg`
- `DNS_SERVERS` kept (`8.8.8.8,8.8.4.4`), wired into connect

`.env.example`: add `MONGODB_DB_NAME=crushsvg` (URI line already present).

## Verification

1. `npx tsc --noEmit` — no type errors
2. `npm run lint`
3. `npm test` — vitest suite green
4. Live connect check — boot dev server, hit health endpoint, confirm
   `Connected to MongoDB` with the new Atlas cluster
5. Spot-check session create/refresh round trip if cluster reachable

## Out of scope

- Data migration (schemas map 1:1 onto existing docs)
- Removing `mongodb` from package.json (mongoose peer dependency)
- Conversion history feature (already stubbed in `conversions/route.ts`)
- Changing API response shapes
