import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import VerifyEmail from '@/emails/templates/VerifyEmail'
import PasswordReset from '@/emails/templates/PasswordReset'
import { renderEmail } from '@/emails/renderEmail'

const DEFAULT_FROM = 'CrushSVG <onboarding@resend.dev>'

export type EmailTransport = 'resend' | 'smtp' | 'none'

export function resolveFrom(env: NodeJS.ProcessEnv = process.env): string {
  return env.RESEND_FROM || env.EMAIL_FROM || DEFAULT_FROM
}

export function resolveTransport(env: NodeJS.ProcessEnv = process.env): EmailTransport {
  if (env.RESEND_API_KEY) return 'resend'
  if (env.SMTP_HOST) return 'smtp'
  return 'none'
}

export function buildVerifyUrl(origin: string, token: string): string {
  return `${origin}/api/v1/verification/email/verify/${token}`
}

export function buildResetUrl(origin: string, token: string): string {
  return `${origin}/reset-password/${token}`
}

function smtpTransportOptions(env: NodeJS.ProcessEnv) {
  const port = Number(env.SMTP_PORT ?? 587)
  return {
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const env = process.env
  const from = resolveFrom(env)
  if (resolveTransport(env) === 'resend') {
    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from, to, subject, html })
    if (error) throw new Error(`Resend send failed: ${error.message}`)
    return
  }
  if (resolveTransport(env) === 'smtp') {
    const transporter = nodemailer.createTransport(smtpTransportOptions(env))
    try {
      await transporter.sendMail({ from, to, subject, html })
    } catch (firstErr) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      try {
        await transporter.sendMail({ from, to, subject, html })
      } catch {
        throw firstErr
      }
    }
    return
  }
  throw new Error(
    'Email is not configured: set RESEND_API_KEY (preferred) or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS'
  )
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await sendEmail(to, 'Verify your CrushSVG email', await renderEmail(VerifyEmail({ verifyUrl: url })))
}

export async function sendResetPasswordEmail(to: string, url: string, minutes: number): Promise<void> {
  await sendEmail(
    to,
    'Reset your CrushSVG password',
    await renderEmail(PasswordReset({ resetUrl: url, expiresInMinutes: minutes }))
  )
}
