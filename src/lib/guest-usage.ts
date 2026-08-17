import 'server-only'

import { NextRequest } from 'next/server'

import { GuestUsage } from '@/lib/db'

export function getGuestId(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return request.headers.get('cf-connecting-ip')
}

export async function getGuestUsage(guestId: string): Promise<number> {
  const record = await GuestUsage.findById(guestId)
  return record?.conversionsUsed ?? 0
}

export async function incrementGuestUsage(guestId: string): Promise<number> {
  const record = await GuestUsage.findOneAndUpdate(
    { _id: guestId },
    {
      $inc: { conversionsUsed: 1 },
      $setOnInsert: { _id: guestId },
    },
    { upsert: true, new: true }
  )
  return record?.conversionsUsed ?? 1
}
