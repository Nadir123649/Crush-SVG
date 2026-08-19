import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'

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
  const transport = resolveTransport(env)
  const startedAt = Date.now()
  const logSend = (event: string, extra = '') => {
    console.log(`[email] ${event} to=${to} subject="${subject}" transport=${transport} took=${Date.now() - startedAt}ms ${extra}`)
  }

  if (env.EMAIL_LOG_ONLY === 'true') {
    console.log(`[email:log-only] to=${to} subject="${subject}" (no transport used)`)
    return
  }

  if (transport === 'none') {
    if (env.NODE_ENV === 'development') {
      console.log(`[email:dev] to=${to} subject="${subject}" — no SMTP/Resend configured, skipping`)
      return
    }
    throw new Error(
      'Email is not configured: set RESEND_API_KEY (preferred) or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS'
    )
  }

  if (transport === 'resend') {
    if (from.includes('@resend.dev') && process.env.NODE_ENV === 'production') {
      console.warn(
        `[email] WARNING: sending from the unverified Resend shared domain "${from}" — delivery will be slow/unreliable. Verify a custom domain in Resend and set RESEND_FROM (e.g. "CrushSVG <no-reply@yourdomain.com>").`
      )
    }
    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from, to, subject, html })
    logSend('resend_send', error ? `error=${error.message}` : '')
    if (error) throw new Error(`Resend send failed: ${error.message}`)
    return
  }
  if (transport === 'smtp') {
    const transporter = nodemailer.createTransport(smtpTransportOptions(env))
    try {
      await transporter.sendMail({ from, to, subject, html })
      logSend('smtp_send')
    } catch (firstErr) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      try {
        await transporter.sendMail({ from, to, subject, html })
        logSend('smtp_send_after_retry')
      } catch {
        logSend('smtp_send_failed')
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
  const filePath = path.join(process.cwd(), 'src/emails/email-verification.html')
  let html = await fs.readFile(filePath, 'utf-8')
  html = html.replace(/href="#"/g, `href="${url}"`)
  html = html.replace(/{{first_name}}/g, 'there')
  await sendEmail(to, 'Verify your CrushSVG email', html)
}

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'src/emails/reset-password.html')
  let html = await fs.readFile(filePath, 'utf-8')
  html = html.replace(/href="#"/g, `href="${url}"`)
  html = html.replace(/{{first_name}}/g, 'there')
  await sendEmail(to, 'Reset your CrushSVG password', html)
}
