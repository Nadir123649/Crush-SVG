import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

import { invalidateSessionCache, isAllowedOrigin, isMethodExempt } from '@/lib/auth-middleware'

describe('auth-middleware', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://crush-svg.vercel.app'
  })

  it('allows same-origin POST', () => {
    const req = new NextRequest('https://crush-svg.vercel.app/api/v1/oauth/google', {
      method: 'POST',
      headers: { origin: 'https://crush-svg.vercel.app' },
    })
    expect(isAllowedOrigin(req)).toBe(true)
  })

  it('rejects spoofed subdomain lookalike origins', () => {
    const req = new NextRequest('https://crush-svg.vercel.app/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://crush-svg.vercel.app.evil.example' },
    })
    expect(isAllowedOrigin(req)).toBe(false)
  })

  it('allows localhost origins with any protocol', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
    })
    expect(isAllowedOrigin(req)).toBe(true)
  })

  it('rejects cross-origin POST', () => {
    const req = new NextRequest('https://crush-svg.vercel.app/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })
    expect(isAllowedOrigin(req)).toBe(false)
  })

  it('allows POST without origin or referer (privacy browsers, API clients)', () => {
    const req = new NextRequest('https://crush-svg.vercel.app/api/v1/auth/logout', {
      method: 'POST',
      headers: {},
    })
    expect(isAllowedOrigin(req)).toBe(true)
  })

  it('exempts GET from origin checks', () => {
    const req = new NextRequest('https://crush-svg.vercel.app/api/me', {
      method: 'GET',
      headers: { origin: 'https://evil.example' },
    })
    expect(isMethodExempt(req)).toBe(true)
  })

  it('invalidateSessionCache clears a single entry or everything', async () => {
    await invalidateSessionCache()
    await expect(invalidateSessionCache()).resolves.not.toThrow()
  })
})
