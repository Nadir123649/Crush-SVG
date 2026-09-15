import { NextRequest } from 'next/server'
import { z } from 'zod'
import { NewsletterSubscriber } from '@/lib/database/models/newsletter-subscriber'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'newsletter:subscribe', 5, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many attempts. Try again later.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.email?.[0] ?? 'Invalid email'
    return errorResponse(400, 'validation_error', first, undefined, request)
  }

  const { email } = parsed.data

  try {
    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() })
    if (existing) {
      if (!existing.active) {
        existing.active = true
        existing.subscribedAt = new Date()
        await existing.save()
      }
      return successResponse({ message: 'You are already subscribed!' }, 200, undefined, request)
    }

    await NewsletterSubscriber.create({
      email: email.toLowerCase(),
      source: 'changelog',
      active: true,
    })

    return successResponse({ message: 'Successfully subscribed to changelog updates!' }, 201, undefined, request)
  } catch (error) {
    console.error('Newsletter subscription failed:', error)
    return errorResponse(500, 'server_error', 'Something went wrong. Please try again.', undefined, request)
  }
}
