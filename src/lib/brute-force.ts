import 'server-only'

import { NextRequest } from 'next/server'

import { getClientIp } from '@/lib/ip'
import { getRateStore } from '@/lib/rate-store'

export interface BruteForceResult {
  blocked: boolean
  retryAfter: number
}

const countKey = (identifier: string, ip: string | null) => `bf:${identifier}:${ip}:count`
const lockKey = (identifier: string, ip: string | null) => `bf:${identifier}:${ip}:lock`

export async function checkBruteForce(
  request: NextRequest,
  identifier: string
): Promise<BruteForceResult> {
  const ip = getClientIp(request)
  const store = getRateStore()
  const lockedUntil = Number((await store.get(lockKey(identifier, ip))) ?? 0)
  if (lockedUntil > Date.now()) {
    return { blocked: true, retryAfter: lockedUntil - Date.now() }
  }
  return { blocked: false, retryAfter: 0 }
}

export async function recordFailure(
  request: NextRequest,
  identifier: string
): Promise<number | null> {
  const ip = getClientIp(request)
  const store = getRateStore()
  const count = await store.increment(countKey(identifier, ip), 300_000)

  if (count >= 20) {
    await applyLockout(store, identifier, ip, 300_000)
    return 300_000
  }
  if (count >= 10) {
    await applyLockout(store, identifier, ip, 30_000)
    return 30_000
  }
  if (count >= 5) {
    await applyLockout(store, identifier, ip, 5_000)
    return 5_000
  }
  return null
}

async function applyLockout(
  store: import('@/lib/rate-store').RateStore,
  identifier: string,
  ip: string | null,
  durationMs: number
): Promise<void> {
  await store.set(lockKey(identifier, ip), Date.now() + durationMs, durationMs)
}

export async function resetBruteForce(
  request: NextRequest,
  identifier: string
): Promise<void> {
  const ip = getClientIp(request)
  const store = getRateStore()
  await store.reset(countKey(identifier, ip))
  await store.reset(lockKey(identifier, ip))
}