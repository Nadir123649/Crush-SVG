import 'server-only'

import { NextRequest } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { User } from '@/lib/db'
import { getGuestId, getGuestUsage, incrementGuestUsage } from '@/lib/guest-usage'

export const GUEST_CONVERSION_LIMIT = 3

export type ConversionUsage = {
  kind: 'user' | 'guest' | 'none'
  count: number
  limit: number | null
  remaining: number | null
  limitReached: boolean
  userId?: string
}

export async function getConversionUsage(request: NextRequest): Promise<ConversionUsage> {
  const who = await auth(request)
  if ('user' in who) {
    const user = await User.findById(who.user.id)
    if (!user) {
      return { kind: 'none', count: 0, limit: null, remaining: null, limitReached: false }
    }
    return {
      kind: 'user',
      count: user.conversionsUsed,
      limit: null,
      remaining: null,
      limitReached: false,
      userId: who.user.id,
    }
  }

  const guestId = getGuestId(request)
  if (!guestId) {
    return { kind: 'none', count: 0, limit: null, remaining: null, limitReached: false }
  }

  const count = await getGuestUsage(guestId)
  return {
    kind: 'guest',
    count,
    limit: GUEST_CONVERSION_LIMIT,
    remaining: Math.max(0, GUEST_CONVERSION_LIMIT - count),
    limitReached: count >= GUEST_CONVERSION_LIMIT,
  }
}

export async function incrementConversionUsage(request: NextRequest): Promise<number> {
  const who = await auth(request)
  if ('user' in who) {
    const user = await User.findByIdAndUpdate(
      who.user.id,
      { $inc: { conversionsUsed: 1 } },
      { new: true }
    )
    return user?.conversionsUsed ?? 0
  }

  const guestId = getGuestId(request)
  if (!guestId) return 0
  return incrementGuestUsage(guestId)
}
