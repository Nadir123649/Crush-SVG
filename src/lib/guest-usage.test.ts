import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { ensureGuestId, getGuestId, GUEST_COOKIE_NAME, GUEST_CONVERSION_LIMIT } from '@/lib/guest-usage'

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