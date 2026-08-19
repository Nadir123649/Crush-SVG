import 'server-only'

import { randomUUID } from 'crypto'

import { NextRequest } from 'next/server'

import { GuestUsage } from '@/lib/db'

export const GUEST_CONVERSION_LIMIT = 3

export const GUEST_WINDOW_MS = 10 * 60 * 1000

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
 * A guest's free-conversion budget resets every 10 minutes: the count applies
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
 * current 10-minute window and under the limit. When the window has expired
 * (or no window exists yet), the count resets to 1 and a fresh window starts.
 * Prevents concurrent requests from exceeding the free allowance.
 */
export async function incrementGuestUsage(guestId: string): Promise<number> {
  const now = new Date()
  const windowStartedAfter = new Date(now.getTime() - GUEST_WINDOW_MS)

  const updated = await GuestUsage.findOneAndUpdate(
    {
      _id: guestId,
      $or: [
        { windowStartAt: { $exists: false } },
        { windowStartAt: null },
        { windowStartAt: { $gt: windowStartedAfter } },
      ],
      conversionsUsed: { $lt: GUEST_CONVERSION_LIMIT },
    },
    { $inc: { conversionsUsed: 1 }, $setOnInsert: { _id: guestId, windowStartAt: now } },
    { upsert: true, new: true }
  )
  if (updated) return updated.conversionsUsed

  const record = await GuestUsage.findById(guestId)
  if (!windowExpired(record)) {
    return record?.conversionsUsed ?? 0
  }

  const reset = await GuestUsage.findOneAndUpdate(
    { _id: guestId },
    { $set: { conversionsUsed: 1, windowStartAt: now } },
    { upsert: true, new: true }
  )
  return reset?.conversionsUsed ?? 1
}