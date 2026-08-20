import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { svgValidationSchema } from '@/lib/shared/validation'
import { successResponse, errorResponse } from '@/lib/http/api-response'

export const runtime = 'nodejs'

function isValidSVG(svg: string): { valid: boolean; error?: string } {
  if (!svg || svg.trim().length === 0) {
    return { valid: false, error: 'SVG content is empty' }
  }

  const trimmed = svg.trim()

  if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) {
    return { valid: false, error: 'That doesn\'t look like valid SVG — check your code and try again.' }
  }

  if (!trimmed.includes('xmlns="http://www.w3.org/2000/svg"') &&
      !trimmed.includes("xmlns='http://www.w3.org/2000/svg'")) {
    return { valid: false, error: 'SVG namespace missing. Add xmlns="http://www.w3.org/2000/svg" to your SVG element.' }
  }

  const openTags = (trimmed.match(/<[^/?!][^>]*>/g) || []).length
  const closeTags = (trimmed.match(/<\/[^>]+>/g) || []).length
  const selfClosing = (trimmed.match(/<[^>]+\/>/g) || []).length

  if (openTags !== closeTags + selfClosing) {
    return { valid: false, error: 'SVG tags are not properly closed.' }
  }

  if (trimmed.length > 5 * 1024 * 1024) {
    return { valid: false, error: 'SVG file too large. Maximum size is 5MB.' }
  }

  const dangerousPatterns = [
    /<script\b/i,
    /on\w+\s*=/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'SVG contains potentially unsafe content.' }
    }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'svg:validate', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, '', '', undefined, request)
  }

  const parsed = svgValidationSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { svg } = parsed.data
  const validation = isValidSVG(svg)

  if (!validation.valid) {
    return errorResponse(422, 'invalid_svg', validation.error ?? 'Invalid SVG')
  }

  return successResponse({
    valid: true,
    message: 'SVG is valid',
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'SVG validation endpoint. Use POST with { svg: "your svg content" }',
    example: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>'
    }
  })
}