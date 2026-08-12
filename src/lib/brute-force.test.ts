import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import {
  getClientIp,
  checkBruteForce,
  recordFailure,
  resetBruteForce,
} from '@/lib/brute-force'

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost', { headers })
}

describe('getClientIp', () => {
  it('takes the first segment of x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })
    expect(getClientIp(req)).toBe('203.0.113.5')
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
    for (const ip of ['203.0.113.5', '198.51.100.7']) {
      resetBruteForce(makeRequest({ 'x-forwarded-for': ip }), 'login:user@example.com')
    }
    resetBruteForce(makeRequest(), 'login:user@example.com')
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests before any failure', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    expect(checkBruteForce(req, 'login:user@example.com')).toEqual({ blocked: false, retryAfter: 0 })
  })

  it('records failures and locks at the 5th attempt for 5s', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 1; i < 5; i++) {
      expect(recordFailure(req, 'login:user@example.com')).toBeNull()
    }
    expect(recordFailure(req, 'login:user@example.com')).toBe(5000)
    expect(checkBruteForce(req, 'login:user@example.com')).toEqual({ blocked: true, retryAfter: 5000 })
  })

  it('locks for 30s at 10 failures and 300s at 20 failures', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    let lock: number | null = null
    for (let i = 0; i < 20; i++) {
      lock = recordFailure(req, 'login:user@example.com')
    }
    expect(lock).toBe(300_000)
    expect(checkBruteForce(req, 'login:user@example.com')).toEqual({ blocked: true, retryAfter: 300_000 })
    const req2 = makeRequest({ 'x-forwarded-for': '198.51.100.7' })
    for (let i = 0; i < 10; i++) {
      recordFailure(req2, 'login:user@example.com')
    }
    expect(checkBruteForce(req2, 'login:user@example.com')).toEqual({ blocked: true, retryAfter: 30_000 })
  })

  it('unblocks after the lock window expires', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 0; i < 5; i++) {
      recordFailure(req, 'login:user@example.com')
    }
    expect(checkBruteForce(req, 'login:user@example.com').blocked).toBe(true)
    vi.advanceTimersByTime(5001)
    expect(checkBruteForce(req, 'login:user@example.com')).toEqual({ blocked: false, retryAfter: 0 })
  })

  it('keys failures by identifier and ip', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 0; i < 5; i++) {
      recordFailure(req, 'login:user@example.com')
    }
    const otherIp = makeRequest({ 'x-forwarded-for': '198.51.100.7' })
    expect(checkBruteForce(otherIp, 'login:user@example.com')).toEqual({ blocked: false, retryAfter: 0 })
    expect(checkBruteForce(req, 'login:other@example.com')).toEqual({ blocked: false, retryAfter: 0 })
    expect(checkBruteForce(req, 'login:user@example.com').blocked).toBe(true)
  })

  it('resetBruteForce clears the lock', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5' })
    for (let i = 0; i < 5; i++) {
      recordFailure(req, 'login:user@example.com')
    }
    expect(checkBruteForce(req, 'login:user@example.com').blocked).toBe(true)
    resetBruteForce(req, 'login:user@example.com')
    expect(checkBruteForce(req, 'login:user@example.com')).toEqual({ blocked: false, retryAfter: 0 })
  })
})
