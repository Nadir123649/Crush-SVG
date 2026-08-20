import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const modelMocks = vi.hoisted(() => {
  type Doc = { conversionsUsed: number; windowStartAt: Date | null }
  const docs = new Map<string, Doc>()
  return {
    docs,
    findById: async (id: string) => docs.get(id) ?? null,
    findOneAndUpdate: async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      opts?: { upsert?: boolean; new?: boolean }
    ): Promise<Doc | null> => {
      const id = filter._id as string
      const existing = docs.get(id)
      const isIncrementQuery = (filter.conversionsUsed as { $lt?: number })?.$lt !== undefined
      if (
        existing &&
        isIncrementQuery &&
        existing.conversionsUsed >= (filter.conversionsUsed as { $lt: number }).$lt
      ) {
        // Mirrors real MongoDB: the increment filter excluded the existing doc,
        // and an upsert here would try to insert a duplicate _id — which throws.
        if (opts?.upsert) {
          throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
        }
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
    create: async (input: { _id: string; conversionsUsed: number; windowStartAt: Date }): Promise<Doc> => {
      if (docs.has(input._id)) {
        throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
      }
      const doc = { conversionsUsed: input.conversionsUsed, windowStartAt: input.windowStartAt }
      docs.set(input._id, doc)
      return doc
    },
  }
})

vi.mock('@/lib/database/db', () => ({
  GuestUsage: {
    findById: modelMocks.findById,
    findOneAndUpdate: modelMocks.findOneAndUpdate,
    create: modelMocks.create,
  },
  isDuplicateKeyError: (error: unknown) =>
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000,
}))

import { ensureGuestId, getGuestId, GUEST_COOKIE_NAME, GUEST_CONVERSION_LIMIT, GUEST_WINDOW_MS, getGuestUsage, incrementGuestUsage } from '@/lib/usage/guest-usage'

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

describe('guest conversion window (24-hour reset)', () => {
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

  it('returns zero when the 24-hour window has expired', async () => {
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

  it('resets to 1 and starts a fresh window after 24 hours', async () => {
    modelMocks.docs.set('g1', {
      conversionsUsed: 3,
      windowStartAt: new Date(Date.now() - GUEST_WINDOW_MS - 1000),
    })
    expect(await incrementGuestUsage('g1')).toBe(1)
    expect(await getGuestUsage('g1')).toBe(1)
  })

  it('resets an expired partially-used window without throwing', async () => {
    modelMocks.docs.set('g1', {
      conversionsUsed: 2,
      windowStartAt: new Date(Date.now() - GUEST_WINDOW_MS - 1000),
    })
    expect(await incrementGuestUsage('g1')).toBe(1)
    expect(await getGuestUsage('g1')).toBe(1)
  })

  it('creates a window atomically when two requests race', async () => {
    const results = await Promise.all([
      incrementGuestUsage('g1'),
      incrementGuestUsage('g1'),
    ])
    // Exactly one request creates the window (count 1); the loser re-reads and
    // increments to 2. The total must never exceed the 3-conversion limit.
    expect(results.sort()).toEqual([1, 2])
    expect(await getGuestUsage('g1')).toBe(2)
  })
})