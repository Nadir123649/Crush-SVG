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

  it('falls back to the client IP when no cookie exists', () => {
    const request = req({ 'x-real-ip': '203.0.113.7' })
    expect(getGuestId(request)).toBe('203.0.113.7')
  })

  it('returns null when neither IP nor cookie exist', () => {
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

  it('uses the client IP and does not set a cookie when cookies are unavailable', () => {
    const request = req({ 'x-real-ip': '203.0.113.7' })
    const result = ensureGuestId(request)
    expect(result.guestId).toBe('203.0.113.7')
    expect(result.setCookie).toBeNull()
  })

  it('generates a fresh uuid cookie when nothing else exists', () => {
    const result = ensureGuestId(req())
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