import { NextRequest, NextResponse, after } from 'next/server'
import { revalidatePath } from 'next/cache'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { convertSchema } from '@/lib/svg/convert-validation'
import { convertSvgQueued } from '@/lib/svg/conversion-queue'
import { getConversionUsage, incrementConversionUsage, GUEST_CONVERSION_LIMIT, type ResolvedAuth } from '@/lib/usage/conversion-usage'
import { logConversion } from '@/lib/usage/conversion-logger'
import { ensureGuestId, GUEST_COOKIE_NAME, claimGuestSlot, releaseGuestSlot } from '@/lib/usage/guest-usage'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { unauthorizedResponse } from '@/lib/http/unauthorized'
import { classifySvgError } from '@/lib/svg/svg-errors'
import { auth } from '@/lib/middleware/auth-middleware'

export const runtime = 'nodejs'
export const maxDuration = 30

function mark(): number {
  return performance.now()
}

function elapsed(start: number): number {
  return Math.round(performance.now() - start)
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

  // Resolve auth once — reused by getConversionUsage and incrementConversionUsage
  const tAuthStart = mark()
  const resolvedAuth: ResolvedAuth = await auth(request)
  const tAuth = elapsed(tAuthStart)

  // For guests: atomically claim a slot before rendering.
  // claimGuestSlot uses $lt:GUEST_CONVERSION_LIMIT in the update filter,
  // so it never grants a slot to a guest already at the limit even under
  // concurrent requests. If it returns null the limit has been reached.
  let conversionsUsed = 0
  let slotClaimed = false

  const tUsageStart = mark()
  if (guestId && !('user' in resolvedAuth)) {
    const claimed = await claimGuestSlot(guestId)
    if (claimed === null) {
      return errorResponse(
        429,
        'limit_reached',
        "You've used your 3 free conversions. Create a free account to keep converting.",
        undefined,
        request
      )
    }
    conversionsUsed = claimed
    slotClaimed = true
  } else {
    // Authenticated path: check usage (no limit to enforce)
    const usage = await getConversionUsage(request, undefined, resolvedAuth)
    if (usage.kind === 'auth-error') {
      return unauthorizedResponse('Session expired. Please sign in again.', request)
    }
  }
  const tUsage = elapsed(tUsageStart)

  // Re-fetch usage for response fields (remaining, conversionsUsed for auth users)
  // For guests we already have conversionsUsed from the atomic claim above.
  const usageForResponse = !slotClaimed
    ? await getConversionUsage(request, guestId ?? undefined, resolvedAuth)
    : null

  const { svg, width, height, scale, transparent, quality, bgOption, bgColor } = parsed.data

  const tRenderStart = mark()
  let result
  try {
    result = await convertSvgQueued(svg, { width, height, scale, transparent, quality, bgOption, bgColor })
  } catch (renderError) {
    // Release the claimed guest slot so the guest isn't penalised for a failed render
    if (slotClaimed && guestId) {
      releaseGuestSlot(guestId).catch((e) =>
        console.error('[convert] Failed to release guest slot after render error:', e)
      )
    }

    console.error('SVG conversion failed:', renderError)
    const info = classifySvgError(renderError)

    after(async () => {
      try {
        await logConversion({
          userId: usageForResponse?.userId,
          guestId: guestId ?? undefined,
          inputFormat: 'svg',
          outputFormat: 'png',
          success: false,
          errorReason: info.code,
        })
      } catch (e) {
        console.error('[convert] after(): failed to log failed conversion:', e)
      }
    })

    return errorResponse(info.status, info.code, info.message, undefined, request)
  }
  const tRender = elapsed(tRenderStart)

  const base64 = result.buffer.toString('base64')
  const mimeType = 'image/png'

  const tTotal = elapsed(t0)
  const tOverhead = tTotal - tRl - tAuth - tUsage - tRender
  const serverTiming = [
    `rl;dur=${tRl}`,
    `auth;dur=${tAuth}`,
    `usage;dur=${tUsage}`,
    `render;dur=${tRender}`,
    `overhead;dur=${tOverhead}`,
  ].join(', ')

  console.log(JSON.stringify({
    msg: 'convert_timing',
    totalMs: tTotal,
    rlMs: tRl,
    authMs: tAuth,
    usageMs: tUsage,
    renderMs: tRender,
    overheadMs: tOverhead,
    requestId: request.headers.get('x-request-id'),
  }))

  // Non-critical work deferred until after the response is sent.
  // Authenticated-user increment is safe to defer (no limit to enforce).
  // logConversion and revalidatePath are always deferred.
  after(async () => {
    try {
      if (!slotClaimed) {
        await incrementConversionUsage(request, undefined, resolvedAuth)
      }
    } catch (e) {
      console.error('[convert] after(): failed to increment user usage:', e)
    }
    try {
      await logConversion({
        userId: usageForResponse?.userId,
        guestId: slotClaimed ? (guestId ?? undefined) : undefined,
        inputFormat: 'svg',
        outputFormat: 'png',
        originalSize: result.buffer.length,
        success: true,
      })
    } catch (e) {
      console.error('[convert] after(): failed to log conversion:', e)
    }
    try {
      // Invalidate admin dashboard cache for real-time metrics
      revalidatePath('/admin')
    } catch (e) {
      console.error('[convert] after(): revalidatePath failed:', e)
    }
  })

  const nextUsed = slotClaimed ? conversionsUsed : undefined
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
