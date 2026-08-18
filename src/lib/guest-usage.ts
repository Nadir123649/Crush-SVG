import 'server-only'

import { NextRequest } from 'next/server'

import { GuestUsage } from '@/lib/db'
import { getClientIp } from '@/lib/ip'

export const GUEST_CONVERSION_LIMIT = 3

export function getGuestId(request: NextRequest): string | null {
  return getClientIp(request)
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