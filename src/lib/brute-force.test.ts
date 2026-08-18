import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { getClientIp } from '@/lib/ip'
import {
  checkBruteForce,
  recordFailure,
  resetBruteForce,
} from '@/lib/brute-force'
import { resetRateStore } from '@/lib/rate-store'

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost', { headers })
}

beforeEach(() => {
  // These tests model a deployment behind a trusted proxy that sets x-forwarded-for.
  process.env.TRUST_PROXY = 'true'
})

afterEach(() => {
  delete process.env.TRUST_PROXY
})

describe('getClientIp', () => {
  it('takes the first segment of x-forwarded-for when behind a trusted proxy', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })
    expect(getClientIp(req)).toBe('203.0.113.5')
  })

  it('does not trust x-forwarded-for when TRUST_PROXY is unset', () => {
    delete process.env.TRUST_PROXY
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })
    expect(getClientIp(req)).toBeNull()
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.7' })
    expect(getClientIp(req)).toBe('198.51.100.7')
  })

  it('falls back to cf-connecting-ip when other headers are absent', () => {
    const req = makeRequest({ 'cf-connecting-ip': '192.0.2.9' })
    expect(getClientIp(req)).toBe('192.0.2.9')
  })

  it('returns null when no proxy header exists', () => {
    expect(getClientIp(makeRequest())).toBeNull()
  })
})

describe('brute force', () => {
  beforeEach(() => {
    resetRateStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests before any failure', async () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toEqual({ blocked: false, retryAfter: 0 })
  })

  it('records failures and locks at the 5th attempt for 5s', async () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 1; i < 5; i++) {
      await expect(recordFailure(req, 'login:user@example.com')).resolves.toBeNull()
    }
    await expect(recordFailure(req, 'login:user@example.com')).resolves.toBe(5000)
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toEqual({ blocked: true, retryAfter: 5000 })
  })

  it('locks for 30s at 10 failures and 300s at 20 failures', async () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    let lock: number | null = null
    for (let i = 0; i < 20; i++) {
      lock = await recordFailure(req, 'login:user@example.com')
    }
    expect(lock).toBe(300_000)
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toEqual({ blocked: true, retryAfter: 300_000 })
    const req2 = makeRequest({ 'x-forwarded-for': '198.51.100.7' })
    for (let i = 0; i < 10; i++) {
      await recordFailure(req2, 'login:user@example.com')
    }
    await expect(checkBruteForce(req2, 'login:user@example.com')).resolves.toEqual({ blocked: true, retryAfter: 30_000 })
  })

  it('unblocks after the lock window expires', async () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 0; i < 5; i++) {
      await recordFailure(req, 'login:user@example.com')
    }
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toMatchObject({ blocked: true })
    vi.advanceTimersByTime(5001)
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toEqual({ blocked: false, retryAfter: 0 })
  })

  it('keys failures by identifier and ip', async () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 0; i < 5; i++) {
      await recordFailure(req, 'login:user@example.com')
    }
    const otherIp = makeRequest({ 'x-forwarded-for': '198.51.100.7' })
    await expect(checkBruteForce(otherIp, 'login:user@example.com')).resolves.toEqual({ blocked: false, retryAfter: 0 })
    await expect(checkBruteForce(req, 'login:other@example.com')).resolves.toEqual({ blocked: false, retryAfter: 0 })
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toMatchObject({ blocked: true })
  })

  it('resetBruteForce clears the lock', async () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 0; i < 5; i++) {
      await recordFailure(req, 'login:user@example.com')
    }
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toMatchObject({ blocked: true })
    await resetBruteForce(req, 'login:user@example.com')
    await expect(checkBruteForce(req, 'login:user@example.com')).resolves.toEqual({ blocked: false, retryAfter: 0 })
  })
})