import 'server-only'

import { randomUUID } from 'crypto'

import { NextRequest } from 'next/server'

import { GuestUsage } from '@/lib/db'
import { getClientIp } from '@/lib/ip'

export const GUEST_CONVERSION_LIMIT = 3

export const GUEST_COOKIE_NAME = 'gid'
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export function getGuestId(request: NextRequest): string | null {
  return getClientIp(request) ?? request.cookies.get(GUEST_COOKIE_NAME)?.value ?? null
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
 * Returns a stable guest identifier for the request. Falls back to a signed-out
 * `gid` cookie when no client IP is available (e.g. local dev), so the 3-free-
 * conversion limit works everywhere. When no cookie exists yet, `setCookie` is
 * populated so the caller can attach it to the response.
 */
export function ensureGuestId(
  request: NextRequest,
  env: NodeJS.ProcessEnv = process.env
): { guestId: string | null; setCookie: GuestCookieSpec | null } {
  const ip = getClientIp(request)
  if (ip) return { guestId: ip, setCookie: null }

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

export async function getGuestUsage(guestId: string): Promise<number> {
  const record = await GuestUsage.findById(guestId)
  return record?.conversionsUsed ?? 0
}

/**
 * Atomically increments guest usage only while the guest is still under the
 * limit. Prevents concurrent requests from exceeding the free allowance.
 * Returns the post-increment count (or the current count when already capped).
 */
export async function incrementGuestUsage(guestId: string): Promise<number> {
  const updated = await GuestUsage.findOneAndUpdate(
    { _id: guestId, conversionsUsed: { $lt: GUEST_CONVERSION_LIMIT } },
    { $inc: { conversionsUsed: 1 }, $setOnInsert: { _id: guestId } },
    { upsert: true, new: true }
  )
  if (updated) return updated.conversionsUsed
  return getGuestUsage(guestId)
}