import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const sendMail = vi.fn()
  return {
    sendMail,
    createTransport: vi.fn(() => ({ sendMail })),
    resendSend: vi.fn(),
  }
})

vi.mock('nodemailer', () => ({
  default: { createTransport: mocks.createTransport },
}))

vi.mock('resend', () => ({
  Resend: vi.fn(function () {
    return { emails: { send: mocks.resendSend } }
  }),
}))

import {
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  buildVerifyUrl,
  buildResetUrl,
  resolveFrom,
  resolveTransport,
} from '@/emails/email'

const DEFAULT_FROM = 'CrushSVG <onboarding@resend.dev>'

describe('email URL builders', () => {
  it('builds verify and reset URLs', () => {
    expect(buildVerifyUrl('http://localhost:3000', 'tok123')).toBe(
      'http://localhost:3000/api/v1/verification/email/verify/tok123'
    )
    expect(buildResetUrl('https://crushsvg.app', 'tok456')).toBe('https://crushsvg.app/reset-password/tok456')
  })
})

describe('resolveFrom', () => {
  afterEach(() => {
    delete process.env.RESEND_FROM
    delete process.env.EMAIL_FROM
  })

  it('defaults to the CrushSVG onboarding sender', () => {
    expect(resolveFrom()).toBe(DEFAULT_FROM)
  })

  it('prefers RESEND_FROM over EMAIL_FROM', () => {
    process.env.EMAIL_FROM = 'Team <team@example.com>'
    process.env.RESEND_FROM = 'Resend <noreply@crush-svg.vercel.app>'
    expect(resolveFrom()).toBe('Resend <noreply@crush-svg.vercel.app>')
  })

  it('falls back to EMAIL_FROM when RESEND_FROM is unset', () => {
    process.env.EMAIL_FROM = 'Team <team@example.com>'
    expect(resolveFrom()).toBe('Team <team@example.com>')
  })
})

describe('resolveTransport', () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.SMTP_HOST
  })

  it('returns none when no provider is configured', () => {
    expect(resolveTransport()).toBe('none')
  })

  it('prefers Resend over SMTP when both are set', () => {
    process.env.RESEND_API_KEY = 're_test'
    process.env.SMTP_HOST = 'smtp.example.com'
    expect(resolveTransport()).toBe('resend')
  })

  it('selects SMTP when only SMTP_HOST is set', () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    expect(resolveTransport()).toBe('smtp')
  })
})

describe('sendEmail', () => {
  beforeEach(() => {
    mocks.sendMail.mockReset()
    mocks.createTransport.mockClear()
    mocks.resendSend.mockReset()
    delete process.env.RESEND_API_KEY
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.RESEND_FROM
    delete process.env.EMAIL_FROM
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.RESEND_FROM
    delete process.env.EMAIL_FROM
  })

  it('throws when email is not configured', async () => {
    await expect(sendEmail('a@b.com', 'Subject', '<p>hi</p>')).rejects.toThrow(/Email is not configured/)
  })

  it('sends via SMTP with resolved from and transport options', async () => {
    mocks.sendMail.mockResolvedValue(undefined)
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'

    await sendEmail('a@b.com', 'Subject', '<p>hi</p>')

    expect(mocks.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: DEFAULT_FROM,
      to: 'a@b.com',
      subject: 'Subject',
      html: '<p>hi</p>',
    })
  })

  it('uses secure transport on port 465', async () => {
    mocks.sendMail.mockResolvedValue(undefined)
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '465'

    await sendEmail('a@b.com', 'Subject', '<p>hi</p>')

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true })
    )
  })

  it('retries once after 1s on a transient SMTP failure', async () => {
    mocks.sendMail.mockRejectedValueOnce(new Error('ETIMEDOUT')).mockResolvedValueOnce(undefined)
    process.env.SMTP_HOST = 'smtp.example.com'

    await expect(sendEmail('a@b.com', 'Subject', '<p>hi</p>')).resolves.toBeUndefined()
    expect(mocks.sendMail).toHaveBeenCalledTimes(2)
  })

  it('rethrows the first error when both SMTP attempts fail', async () => {
    const first = new Error('socket hang up')
    mocks.sendMail.mockRejectedValue(first)
    process.env.SMTP_HOST = 'smtp.example.com'

    await expect(sendEmail('a@b.com', 'Subject', '<p>hi</p>')).rejects.toThrow('socket hang up')
    expect(mocks.sendMail).toHaveBeenCalledTimes(2)
  })

  it('sends via Resend when RESEND_API_KEY is set', async () => {
    mocks.resendSend.mockResolvedValue({ data: { id: 'mail-1' }, error: null })
    process.env.RESEND_API_KEY = 're_test'
    process.env.RESEND_FROM = 'Resend <noreply@crush-svg.vercel.app>'

    await sendEmail('a@b.com', 'Subject', '<p>hi</p>')

    expect(mocks.resendSend).toHaveBeenCalledWith({
      from: 'Resend <noreply@crush-svg.vercel.app>',
      to: 'a@b.com',
      subject: 'Subject',
      html: '<p>hi</p>',
    })
    expect(mocks.createTransport).not.toHaveBeenCalled()
  })
})

describe('sendVerificationEmail / sendResetPasswordEmail', () => {
  beforeEach(() => {
    mocks.sendMail.mockReset()
    mocks.resendSend.mockReset()
    process.env.SMTP_HOST = 'smtp.example.com'
  })

  afterEach(() => {
    delete process.env.SMTP_HOST
  })

  it('sendVerificationEmail uses the verify subject', async () => {
    mocks.sendMail.mockResolvedValue(undefined)
    await sendVerificationEmail('a@b.com', 'https://x/verify/tok')
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@b.com', subject: 'Verify your CrushSVG email' })
    )
  })

  it('sendResetPasswordEmail uses the reset subject and mentions expiry', async () => {
    mocks.sendMail.mockResolvedValue(undefined)
    await sendResetPasswordEmail('a@b.com', 'https://x/reset/tok')
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@b.com', subject: 'Reset your CrushSVG password' })
    )
  })
})
