import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const modelMocks = vi.hoisted(() => {
  type Doc = { conversionsUsed: number; windowStartAt: Date | null }
  const docs = new Map<string, Doc>()
  const windowActive = (doc: Doc | undefined): boolean => {
    if (!doc) return false
    if (doc.windowStartAt == null) return true
    return Date.now() - doc.windowStartAt.getTime() < 10 * 60 * 1000
  }
  return {
    docs,
    findById: async (id: string) => docs.get(id) ?? null,
    findOneAndUpdate: async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      opts: { upsert: boolean; new: boolean }
    ): Promise<Doc | null> => {
      const id = filter._id as string
      const existing = docs.get(id)
      const isIncrementQuery = Array.isArray(filter.$or)
      if (
        existing &&
        isIncrementQuery &&
        (!windowActive(existing) || existing.conversionsUsed >= (filter.conversionsUsed as { $lt: number }).$lt)
      ) {
        return null
      }
      const now = new Date()
      const set = (update.$set ?? {}) as { conversionsUsed?: number; windowStartAt?: Date }
      const setOnInsert = (update.$setOnInsert ?? {}) as { windowStartAt?: Date }
      const inc = (update.$inc as { conversionsUsed: number })?.conversionsUsed ?? 0
      const next: Doc = existing ?? {
        conversionsUsed: 0,
        windowStartAt: setOnInsert.windowStartAt ?? set.windowStartAt ?? now,
      }
      next.conversionsUsed = next.conversionsUsed + inc
      if (set.conversionsUsed !== undefined) next.conversionsUsed = set.conversionsUsed
      if (set.windowStartAt !== undefined) next.windowStartAt = set.windowStartAt
      docs.set(id, next)
      return next
    },
  }
})

vi.mock('@/lib/db', () => ({
  GuestUsage: {
    findById: modelMocks.findById,
    findOneAndUpdate: modelMocks.findOneAndUpdate,
  },
}))

import { ensureGuestId, getGuestId, GUEST_COOKIE_NAME, GUEST_CONVERSION_LIMIT, GUEST_WINDOW_MS, getGuestUsage, incrementGuestUsage } from '@/lib/guest-usage'

function req(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost', { headers })
}

describe('getGuestId', () => {
  it('returns the gid cookie when present', () => {
    const request = req({ cookie: `${GUEST_COOKIE_NAME}=cookie-id-123`, 'x-real-ip': '203.0.113.7' })
    expect(getGuestId(request)).toBe('cookie-id-123')
  })

  it('returns null when no cookie exists (never falls back to the IP)', () => {
    const request = req({ 'x-real-ip': '203.0.113.7' })
    expect(getGuestId(request)).toBeNull()
  })

  it('returns null when no cookie exists at all', () => {
    expect(getGuestId(req())).toBeNull()
  })
})

describe('ensureGuestId', () => {
  it('prefers an existing gid cookie over the client IP', () => {
    const request = req({ cookie: `${GUEST_COOKIE_NAME}=cookie-id-123`, 'x-real-ip': '203.0.113.7' })
    const result = ensureGuestId(request)
    expect(result.guestId).toBe('cookie-id-123')
    expect(result.setCookie).toBeNull()
  })

  it('reuses an existing gid cookie without replacing it', () => {
    const request = req({ cookie: `${GUEST_COOKIE_NAME}=cookie-id-123` })
    const result = ensureGuestId(request)
    expect(result.guestId).toBe('cookie-id-123')
    expect(result.setCookie).toBeNull()
  })

  it('generates a fresh uuid cookie when no cookie exists (ignores the IP)', () => {
    const request = req({ 'x-real-ip': '203.0.113.7' })
    const result = ensureGuestId(request)
    expect(result.guestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.setCookie).toEqual({
      name: GUEST_COOKIE_NAME,
      value: result.guestId,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })
  })

  it('marks the cookie secure in production', () => {
    const result = ensureGuestId(req(), { NODE_ENV: 'production' })
    expect(result.setCookie?.secure).toBe(true)
  })
})

describe('GUEST_CONVERSION_LIMIT', () => {
  it('is three free conversions', () => {
    expect(GUEST_CONVERSION_LIMIT).toBe(3)
  })
})

describe('guest conversion window (10-minute reset)', () => {
  beforeEach(() => {
    modelMocks.docs.clear()
  })

  it('returns zero usage for an unknown guest', async () => {
    expect(await getGuestUsage('no-such-guest')).toBe(0)
  })

  it('returns the count while the window is active', async () => {
    modelMocks.docs.set('g1', { conversionsUsed: 2, windowStartAt: new Date() })
    expect(await getGuestUsage('g1')).toBe(2)
  })

  it('returns zero when the 10-minute window has expired', async () => {
    modelMocks.docs.set('g1', {
      conversionsUsed: 3,
      windowStartAt: new Date(Date.now() - GUEST_WINDOW_MS - 1000),
    })
    expect(await getGuestUsage('g1')).toBe(0)
  })

  it('increments within the window up to the limit', async () => {
    expect(await incrementGuestUsage('g1')).toBe(1)
    expect(await incrementGuestUsage('g1')).toBe(2)
    expect(await incrementGuestUsage('g1')).toBe(3)
  })

  it('caps at the limit while the window is active', async () => {
    modelMocks.docs.set('g1', { conversionsUsed: 3, windowStartAt: new Date() })
    expect(await incrementGuestUsage('g1')).toBe(3)
  })

  it('resets to 1 and starts a fresh window after 10 minutes', async () => {
    modelMocks.docs.set('g1', {
      conversionsUsed: 3,
      windowStartAt: new Date(Date.now() - GUEST_WINDOW_MS - 1000),
    })
    expect(await incrementGuestUsage('g1')).toBe(1)
    expect(await getGuestUsage('g1')).toBe(1)
  })
})