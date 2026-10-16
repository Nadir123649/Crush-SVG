import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { svgValidationSchema } from '@/lib/shared/validation'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { validateSvgMarkup } from '@/lib/svg/validate-svg-markup'

export const runtime = 'nodejs'

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
  const validation = validateSvgMarkup(svg)

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
