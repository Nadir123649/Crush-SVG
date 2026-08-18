import { describe, it, expect } from 'vitest'

import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  VERIFY_TOKEN_MINUTES,
  RESET_TOKEN_MINUTES,
} from '@/lib/passwords'

describe('passwords', () => {
  it('hashes a password with bcrypt (10 rounds) and verifies it', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).not.toBe('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('produces unique hashes for the same password', async () => {
    const [a, b] = await Promise.all([hashPassword('secret123'), hashPassword('secret123')])
    expect(a).not.toBe(b)
  })

  it('generateToken returns 64 hex chars', () => {
    const token = generateToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(generateToken()).not.toBe(token)
  })

  it('hashToken is a stable 64-char sha256 hex digest', () => {
    const digest = hashToken('abc')
    expect(digest).toMatch(/^[0-9a-f]{64}$/)
    expect(hashToken('abc')).toBe(digest)
    expect(hashToken('abd')).not.toBe(digest)
  })

  it('exposes token lifetime constants', () => {
    expect(VERIFY_TOKEN_MINUTES).toBe(24 * 60)
    expect(RESET_TOKEN_MINUTES).toBe(30)
  })
})
