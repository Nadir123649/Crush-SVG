import { describe, expect, it, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { getOrigin } from '@/lib/api-response'

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL
const ORIGINAL_APP_ORIGINS = process.env.APP_ORIGINS
const ORIGINAL_TRUST_PROXY = process.env.TRUST_PROXY

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL
  if (ORIGINAL_APP_ORIGINS === undefined) delete process.env.APP_ORIGINS
  else process.env.APP_ORIGINS = ORIGINAL_APP_ORIGINS
  if (ORIGINAL_TRUST_PROXY === undefined) delete process.env.TRUST_PROXY
  else process.env.TRUST_PROXY = ORIGINAL_TRUST_PROXY
})

function req(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost', { headers })
}

describe('getOrigin', () => {
  it('uses the localhost host in dev even when NEXT_PUBLIC_APP_URL is set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    const request = req({ host: 'localhost:3000' })
    expect(getOrigin(request)).toBe('http://localhost:3000')
  })

  it('uses the deployed host (Vercel) instead of the local .env URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.TRUST_PROXY = 'true'
    const request = req({
      'x-forwarded-host': 'crush-svg.vercel.app',
      'x-forwarded-proto': 'https',
    })
    expect(getOrigin(request)).toBe('https://crush-svg.vercel.app')
  })

  it('uses the deployed host even when unlisted and TRUST_PROXY is unset', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    const request = req({
      'x-forwarded-host': 'crush-svg.vercel.app',
      'x-forwarded-proto': 'https',
    })
    expect(getOrigin(request)).toBe('https://crush-svg.vercel.app')
  })

  it('uses a custom domain listed in APP_ORIGINS', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.APP_ORIGINS = 'crush-svg.vercel.app'
    const request = req({ host: 'crush-svg.vercel.app' })
    expect(getOrigin(request)).toBe('https://crush-svg.vercel.app')
  })

  it('falls back to the canonical URL for IP-literal hosts', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://crush-svg.vercel.app'
    const request = req({ host: '203.0.113.5' })
    expect(getOrigin(request)).toBe('https://crush-svg.vercel.app')
  })

  it('falls back to https on the first allowed host when nothing else matches', () => {
    process.env.NEXT_PUBLIC_APP_URL = ''
    process.env.APP_ORIGINS = 'crush-svg.vercel.app'
    const request = req({ host: '203.0.113.5' })
    expect(getOrigin(request)).toBe('https://crush-svg.vercel.app')
  })

  it('keeps localhost links in dev when the host is an unlisted local host', () => {
    process.env.NEXT_PUBLIC_APP_URL = ''
    const request = req({ host: 'localhost:3000' })
    expect(getOrigin(request)).toBe('http://localhost:3000')
  })
})