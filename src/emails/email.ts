import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'

const DEFAULT_FROM = 'CrushSVG <no-reply@crushsvg.net>'

export type EmailTransport = 'smtp' | 'none'

export function resolveFrom(env: NodeJS.ProcessEnv = process.env): string {
  return env.EMAIL_FROM || DEFAULT_FROM
}

export function resolveTransport(env: NodeJS.ProcessEnv = process.env): EmailTransport {
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
      console.log(`[email:dev] to=${to} subject="${subject}" — no SMTP configured, skipping`)
      return
    }
    throw new Error(
      'Email is not configured: set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS'
    )
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
    'Email is not configured: set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS'
  )
}

function rewriteSiteLinks(html: string, url: string): string {
  const origin = /^https?:\/\/[^/]+/.exec(url)?.[0]
  if (!origin) return html
  return html.split('https://crush-svg.vercel.app').join(origin)
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'src/emails/email-verification.html')
  let html = await fs.readFile(filePath, 'utf-8')
  html = html.replace(/href="#"/g, `href="${url}"`)
  html = html.replace(/{{first_name}}/g, 'there')
  html = rewriteSiteLinks(html, url)
  await sendEmail(to, 'Verify your CrushSVG email', html)
}

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'src/emails/reset-password.html')
  let html = await fs.readFile(filePath, 'utf-8')
  html = html.replace(/href="#"/g, `href="${url}"`)
  html = html.replace(/{{first_name}}/g, 'there')
  html = rewriteSiteLinks(html, url)
  await sendEmail(to, 'Reset your CrushSVG password', html)
}
