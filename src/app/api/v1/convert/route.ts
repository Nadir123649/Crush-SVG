import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { convertSchema } from '@/lib/convert-validation'
import { convertSvgQueued } from '@/lib/conversion-queue'
import { getConversionUsage, incrementConversionUsage, GUEST_CONVERSION_LIMIT } from '@/lib/conversion-usage'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'convert:svg', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many conversion requests. Try again later.', rateLimitHeaders(rl), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
  }

  const parsed = convertSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first, undefined, request)
  }

  const usage = await getConversionUsage(request)
  if (usage.kind === 'guest' && usage.limitReached) {
    return errorResponse(
      429,
      'limit_reached',
      "You've used your 3 free conversions. Create a free account to keep converting.",
      undefined,
      request
    )
  }

  const { svg, format, width, scale, transparent, quality } = parsed.data

  try {
    const result = await convertSvgQueued(svg, { format, width, scale, transparent, quality })
    const base64 = result.buffer.toString('base64')
    const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`

    const conversionsUsed = await incrementConversionUsage(request)
    const remaining =
      usage.kind === 'guest' ? Math.max(0, GUEST_CONVERSION_LIMIT - conversionsUsed) : undefined

    const acceptsBinary =
      request.headers.get('accept')?.includes('application/octet-stream') ||
      request.nextUrl.searchParams.get('download') === '1'

    if (acceptsBinary) {
      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="crushsvg-${Date.now()}.${format === 'jpeg' ? 'jpg' : format}"`,
          'Content-Length': String(result.buffer.length),
          'X-Conversions-Used': String(conversionsUsed),
          ...(remaining !== undefined ? { 'X-Conversions-Remaining': String(remaining) } : {}),
        },
      })
    }

    return successResponse(
      {
        data: base64,
        mimeType,
        size: result.buffer.length,
        format,
        width: result.width,
        height: result.height,
        conversionsUsed,
        remaining,
      },
      200,
      undefined,
      request
    )
  } catch (error) {
    console.error('SVG conversion failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('Input buffer contains unsupported image format')) {
        return errorResponse(
          422,
          'invalid_svg',
          "That doesn't look like valid SVG — check your code and try again.",
          undefined,
          request
        )
      }
      if (error.message.includes('limitInputPixels')) {
        return errorResponse(422, 'svg_too_large', 'SVG dimensions too large. Maximum 8192px.', undefined, request)
      }
    }

    return errorResponse(500, 'conversion_failed', 'Conversion failed. Please try again.', undefined, request)
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      version: '1.0.0',
      payload: {
        message: 'SVG conversion endpoint',
        formats: ['png', 'jpeg', 'webp'],
        example: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>',
          format: 'png',
          width: 480,
          scale: 2,
          transparent: true,
          quality: 90,
        },
      },
      serverTimestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
