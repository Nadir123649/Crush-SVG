import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { convertSchema } from '@/lib/convert-validation'
import { convertSvgQueued } from '@/lib/conversion-queue'
import { getConversionUsage, incrementConversionUsage, GUEST_CONVERSION_LIMIT } from '@/lib/conversion-usage'
import { ensureGuestId, GUEST_COOKIE_NAME } from '@/lib/guest-usage'
import { successResponse, errorResponse } from '@/lib/api-response'
import { classifySvgError } from '@/lib/svg-errors'

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

  const { guestId, setCookie } = ensureGuestId(request)
  const usage = await getConversionUsage(request, guestId ?? undefined)
  if (usage.kind === 'guest' && usage.limitReached) {
    return errorResponse(
      429,
      'limit_reached',
      "You've used your 3 free conversions. Create a free account to keep converting.",
      undefined,
      request
    )
  }

  const { svg, width, height, scale, transparent, quality } = parsed.data

  try {
    const result = await convertSvgQueued(svg, { width, height, scale, transparent, quality })
    const base64 = result.buffer.toString('base64')
    const mimeType = 'image/png'

    let conversionsUsed = 0
    try {
      conversionsUsed = await incrementConversionUsage(request, guestId ?? undefined)
    } catch (error) {
      console.error('Failed to record conversion usage:', error)
    }

    const nextUsed =
      usage.kind === 'guest' ? Math.min(GUEST_CONVERSION_LIMIT, usage.count + 1) : undefined
    const remaining =
      nextUsed !== undefined ? Math.max(0, GUEST_CONVERSION_LIMIT - nextUsed) : undefined

    const acceptsBinary =
      request.headers.get('accept')?.includes('application/octet-stream') ||
      request.nextUrl.searchParams.get('download') === '1'

    if (acceptsBinary) {
      const res = new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="crushsvg-${Date.now()}.png"`,
          'Content-Length': String(result.buffer.length),
          'X-Conversions-Used': String(conversionsUsed),
          ...(remaining !== undefined ? { 'X-Conversions-Remaining': String(remaining) } : {}),
        },
      })
      if (setCookie) {
        res.cookies.set(GUEST_COOKIE_NAME, setCookie.value, {
          httpOnly: true,
          secure: setCookie.secure,
          sameSite: 'lax',
          path: '/',
          maxAge: setCookie.maxAge,
        })
      }
      return res
    }

    const res = successResponse(
      {
        data: base64,
        mimeType,
        size: result.buffer.length,
        format: result.format,
        width: result.width,
        height: result.height,
        warnings: result.warnings,
        conversionsUsed,
        remaining,
      },
      200,
      undefined,
      request
    )
    if (setCookie) {
      res.cookies.set(GUEST_COOKIE_NAME, setCookie.value, {
        httpOnly: true,
        secure: setCookie.secure,
        sameSite: 'lax',
        path: '/',
        maxAge: setCookie.maxAge,
      })
    }
    return res
  } catch (error) {
    console.error('SVG conversion failed:', error)

    const info = classifySvgError(error)
    return errorResponse(info.status, info.code, info.message, undefined, request)
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      version: '1.0.0',
      payload: {
        message: 'SVG to PNG conversion endpoint',
        formats: ['png'],
        maxOutputSize: 4000,
        example: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>',
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