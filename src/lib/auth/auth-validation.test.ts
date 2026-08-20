import { describe, it, expect } from 'vitest'

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@/lib/auth/auth-validation'

describe('registerSchema', () => {
  it('accepts a valid payload and trims name/email', () => {
    const result = registerSchema.parse({
      name: '  Alex  ',
      email: '  ALEX@example.com  ',
      password: 'secret123',
    })
    expect(result.name).toBe('Alex')
    expect(result.email).toBe('ALEX@example.com')
  })

  it('rejects empty name and name over 20 chars', () => {
    expect(() => registerSchema.parse({ name: '   ', email: 'a@b.com', password: 'secret123' })).toThrow()
    expect(() => registerSchema.parse({ name: 'x'.repeat(21), email: 'a@b.com', password: 'secret123' })).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => registerSchema.parse({ name: 'Alex', email: 'not-an-email', password: 'secret123' })).toThrow()
  })

  it('rejects passwords shorter than 8 or longer than 20', () => {
    expect(() => registerSchema.parse({ name: 'Alex', email: 'a@b.com', password: '1234567' })).toThrow()
    expect(() => registerSchema.parse({ name: 'Alex', email: 'a@b.com', password: 'x'.repeat(21) })).toThrow()
  })
})

describe('loginSchema', () => {
  it('accepts email, password and optional rememberMe', () => {
    expect(loginSchema.parse({ email: 'a@b.com', password: 'x' })).toEqual({
      email: 'a@b.com',
      password: 'x',
    })
    expect(loginSchema.parse({ email: 'a@b.com', password: 'x', rememberMe: true }).rememberMe).toBe(true)
  })

  it('rejects empty email or password', () => {
    expect(() => loginSchema.parse({ email: '', password: 'x' })).toThrow()
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow()
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.parse({ email: '  a@b.com  ' })).toEqual({ email: 'a@b.com' })
  })

  it('rejects an invalid email', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'nope' })).toThrow()
  })
})

describe('resetPasswordSchema', () => {
  it('accepts an 8-20 char password', () => {
    expect(resetPasswordSchema.parse({ password: 'newpass123' })).toEqual({ password: 'newpass123' })
  })

  it('rejects passwords out of range', () => {
    expect(() => resetPasswordSchema.parse({ password: 'short' })).toThrow()
    expect(() => resetPasswordSchema.parse({ password: 'x'.repeat(21) })).toThrow()
  })
})

describe('changePasswordSchema', () => {
  it('accepts currentPassword and newPassword', () => {
    const result = changePasswordSchema.parse({ currentPassword: 'oldpass', newPassword: 'newpass123' })
    expect(result.currentPassword).toBe('oldpass')
    expect(result.newPassword).toBe('newpass123')
  })

  it('rejects empty currentPassword or weak newPassword', () => {
    expect(() => changePasswordSchema.parse({ currentPassword: '', newPassword: 'newpass123' })).toThrow()
    expect(() => changePasswordSchema.parse({ currentPassword: 'oldpass', newPassword: 'short' })).toThrow()
  })
})
