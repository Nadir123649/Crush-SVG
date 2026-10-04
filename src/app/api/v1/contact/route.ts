import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Settings } from '@/lib/database/db'
import { sendEmail } from '@/lib/integrations/email'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

const FALLBACK_RECIPIENT = 'support@crushsvg.net'

// Mirrors the client-side rules in ContactUsClient (name >= 3, message >= 10)
// and adds upper bounds so the endpoint cannot be used to relay huge payloads.
const contactSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email format').max(254, 'Email is too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Header values must not contain line breaks (header injection).
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

async function resolveRecipient(): Promise<string> {
  if (process.env.CONTACT_EMAIL_TO) return process.env.CONTACT_EMAIL_TO
  try {
    const settings = await Settings.findOne().lean()
    if (settings?.supportEmail) return settings.supportEmail
  } catch (error) {
    console.error('Contact form: could not read support email from settings:', error)
  }
  return FALLBACK_RECIPIENT
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'contact:submit', 5, 60 * 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many messages. Please try again later.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const first = fieldErrors.name?.[0] ?? fieldErrors.email?.[0] ?? fieldErrors.message?.[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first, undefined, request)
  }

  const { name, email, message } = parsed.data

  try {
    const to = await resolveRecipient()
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">
        <h2 style="margin:0 0 12px">New contact form message</h2>
        <p style="margin:0"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0 0 4px"><strong>Message:</strong></p>
        <div style="white-space:pre-wrap;border-left:3px solid #D94A1E;padding-left:12px">${escapeHtml(message)}</div>
      </div>`

    await sendEmail(to, `[CrushSVG Contact] ${singleLine(name)}`, html, { replyTo: email })

    return successResponse({ message: 'Message sent. Our team will get back to you shortly.' }, 201, undefined, request)
  } catch (error) {
    // Surface the failure so the visitor knows the message was NOT delivered,
    // instead of silently dropping it.
    console.error('Contact form delivery failed:', error)
    return errorResponse(500, 'server_error', 'Failed to send message. Please try again.', undefined, request)
  }
}
