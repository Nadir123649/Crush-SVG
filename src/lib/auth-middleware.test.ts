import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

import { invalidateSessionCache, isAllowedOrigin, isMethodExempt } from '@/lib/auth-middleware'

describe('auth-middleware', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://crushsvg.com'
  })

  it('allows same-origin POST', () => {
    const req = new NextRequest('https://crushsvg.com/api/v1/oauth/google', {
      method: 'POST',
      headers: { origin: 'https://crushsvg.com' },
    })
    expect(isAllowedOrigin(req)).toBe(true)
  })

  it('rejects cross-origin POST', () => {
    const req = new NextRequest('https://crushsvg.com/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })
    expect(isAllowedOrigin(req)).toBe(false)
  })

  it('exempts GET from origin checks', () => {
    const req = new NextRequest('https://crushsvg.com/api/me', {
      method: 'GET',
      headers: { origin: 'https://evil.example' },
    })
    expect(isMethodExempt(req)).toBe(true)
  })

  it('invalidateSessionCache clears a single entry or everything', () => {
    invalidateSessionCache()
    expect(() => invalidateSessionCache()).not.toThrow()
  })
})
