import { NextRequest, NextResponse, after } from 'next/server'
import { revalidatePath } from 'next/cache'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { convertSchema } from '@/lib/svg/convert-validation'
import { convertSvgQueued } from '@/lib/svg/conversion-queue'
import { getConversionUsage, incrementConversionUsage, GUEST_CONVERSION_LIMIT, type ResolvedAuth } from '@/lib/usage/conversion-usage'
import { logConversion } from '@/lib/usage/conversion-logger'
import { ensureGuestId, GUEST_COOKIE_NAME } from '@/lib/usage/guest-usage'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { unauthorizedResponse } from '@/lib/http/unauthorized'
import { classifySvgError } from '@/lib/svg/svg-errors'
import { auth } from '@/lib/middleware/auth-middleware'

export const runtime = 'nodejs'
export const maxDuration = 30

function mark(): number {
  return performance.now()
}

function elapsed(start: number): string {
  return `${Math.round(performance.now() - start)}`
}

export async function POST(request: NextRequest) {
  const t0 = mark()

  const tRlStart = mark()
  const rl = await checkRateLimit(request, 'convert:svg', 30, 60_000)
  const tRl = elapsed(tRlStart)

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

  // Resolve auth once — reused by both getConversionUsage and incrementConversionUsage
  const tUsageStart = mark()
  const resolvedAuth: ResolvedAuth = await auth(request)
  const usage = await getConversionUsage(request, guestId ?? undefined, resolvedAuth)
  const tUsage = elapsed(tUsageStart)

  if (usage.kind === 'auth-error') {
    return unauthorizedResponse('Session expired. Please sign in again.', request)
  }
  if (usage.kind === 'guest' && usage.limitReached) {
    return errorResponse(
      429,
      'limit_reached',
      "You've used your 3 free conversions. Create a free account to keep converting.",
      undefined,
      request
    )
  }

  const { svg, width, height, scale, transparent, quality, bgOption, bgColor } = parsed.data

  try {
    const tRenderStart = mark()
    const result = await convertSvgQueued(svg, { width, height, scale, transparent, quality, bgOption, bgColor })
    const tRender = elapsed(tRenderStart)

    const base64 = result.buffer.toString('base64')
    const mimeType = 'image/png'

    // Guest increment stays inline: moving it to after() would let concurrent
    // requests both read the same count (< limit) before either increments,
    // allowing a guest to exceed the 3-conversion cap under concurrent load.
    let conversionsUsed = 0
    const tIncrStart = mark()
    if (usage.kind === 'guest') {
      try {
        conversionsUsed = await incrementConversionUsage(request, guestId ?? undefined, resolvedAuth)
      } catch (error) {
        console.error('Failed to record guest conversion usage:', error)
      }
    }
    const tIncr = elapsed(tIncrStart)

    const tTotal = elapsed(t0)
    const serverTiming = [
      `rl;dur=${tRl}`,
      `usage;dur=${tUsage}`,
      `render;dur=${tRender}`,
      `incr;dur=${tIncr}`,
    ].join(', ')

    console.log(JSON.stringify({
      msg: 'convert_timing',
      totalMs: Number(tTotal),
      rlMs: Number(tRl),
      usageMs: Number(tUsage),
      renderMs: Number(tRender),
      incrMs: Number(tIncr),
      requestId: request.headers.get('x-request-id'),
    }))

    // Non-critical work deferred until after the response is sent.
    // For authenticated users, increment is safe to defer (no limit to enforce).
    after(async () => {
      try {
        if (usage.kind !== 'guest') {
          await incrementConversionUsage(request, undefined, resolvedAuth)
        }
        await logConversion({
          userId: usage.userId,
          guestId: usage.kind === 'guest' ? guestId : undefined,
          inputFormat: 'svg',
          outputFormat: 'png',
          originalSize: result.buffer.length,
          success: true,
        })
        // Invalidate admin dashboard cache for real-time metrics
        revalidatePath('/admin')
      } catch (error) {
        console.error('Failed to record conversion usage:', error)
      }
    })

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
          'Server-Timing': serverTiming,
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
      { 'Server-Timing': serverTiming },
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

    after(async () => {
      await logConversion({
        userId: usage.userId,
        guestId: usage.kind === 'guest' ? guestId : undefined,
        inputFormat: 'svg',
        outputFormat: 'png',
        success: false,
        errorReason: info.code,
      }).catch((e) => console.error('Failed to log failed conversion:', e))
    })

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
