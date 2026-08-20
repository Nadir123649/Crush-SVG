import 'server-only'

import { randomUUID } from 'crypto'

import { NextRequest } from 'next/server'

import { GuestUsage, isDuplicateKeyError } from '@/lib/database/db'

export const GUEST_CONVERSION_LIMIT = 3

export const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000

export const GUEST_COOKIE_NAME = 'gid'
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export function getGuestId(request: NextRequest): string | null {
  return request.cookies.get(GUEST_COOKIE_NAME)?.value ?? null
}

export interface GuestCookieSpec {
  name: string
  value: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
  maxAge: number
}

/**
 * Returns a stable guest identifier for the request. The signed-out `gid`
 * cookie is the only key: every visitor gets their own 3-free-conversion
 * budget — even when many visitors share a client IP (local dev, NAT, office
 * networks). When no cookie exists yet, a fresh uuid bucket is created and
 * `setCookie` is populated so the caller can attach it to the response.
 */
export function ensureGuestId(
  request: NextRequest,
  env: NodeJS.ProcessEnv = process.env
): { guestId: string | null; setCookie: GuestCookieSpec | null } {
  const existing = request.cookies.get(GUEST_COOKIE_NAME)?.value
  if (existing) return { guestId: existing, setCookie: null }

  const guestId = randomUUID()
  return {
    guestId,
    setCookie: {
      name: GUEST_COOKIE_NAME,
      value: guestId,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: GUEST_COOKIE_MAX_AGE,
    },
  }
}

/**
 * A guest's free-conversion budget resets every 24 hours: the count applies
 * only to conversions inside the current window, which starts at the first
 * conversion after the previous window expired.
 */
function windowExpired(record: { windowStartAt?: Date | null } | null): boolean {
  if (!record) return true
  const start = record.windowStartAt?.getTime()
  if (!start) return false
  return Date.now() - start >= GUEST_WINDOW_MS
}

export async function getGuestUsage(guestId: string): Promise<number> {
  const record = await GuestUsage.findById(guestId)
  if (windowExpired(record)) return 0
  return record?.conversionsUsed ?? 0
}

/**
 * Atomically increments guest usage only while the guest is still inside the
 * current 24-hour window and under the limit. When the window has expired (or
 * no window exists yet), the count resets to 1 and a fresh window starts.
 * Prevents concurrent requests from exceeding the free allowance.
 *
 * NOTE: never relies on an `upsert` whose filter can exclude an existing
 * document — Mongo would try to insert a duplicate `_id` and throw E11000,
 * silently skipping the reset. All updates here use a plain `_id` match, so a
 * stale or expired record is always updated in place.
 */
export async function incrementGuestUsage(guestId: string): Promise<number> {
  const now = new Date()

  let record = await GuestUsage.findById(guestId)
  if (!record) {
    try {
      await GuestUsage.create({ _id: guestId, conversionsUsed: 1, windowStartAt: now })
      return 1
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
      // Two requests created the window concurrently — re-read and fall through
      // to the update path so exactly one conversion is counted.
      record = await GuestUsage.findById(guestId)
    }
  }

  if (windowExpired(record)) {
    const reset = await GuestUsage.findOneAndUpdate(
      { _id: guestId },
      { $set: { conversionsUsed: 1, windowStartAt: now } },
      { new: true }
    )
    return reset?.conversionsUsed ?? 1
  }

  const incremented = await GuestUsage.findOneAndUpdate(
    { _id: guestId, conversionsUsed: { $lt: GUEST_CONVERSION_LIMIT } },
    { $inc: { conversionsUsed: 1 } },
    { new: true }
  )
  return incremented?.conversionsUsed ?? GUEST_CONVERSION_LIMIT
}