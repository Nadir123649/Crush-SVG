import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { getConversionUsage, incrementConversionUsage, GUEST_CONVERSION_LIMIT } from '@/lib/usage/conversion-usage'
import { logConversion } from '@/lib/usage/conversion-logger'
import { ensureGuestId, GUEST_COOKIE_NAME } from '@/lib/usage/guest-usage'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { uploadImage } from '@/lib/integrations/cloudinary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'convert:vectorize', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.', rateLimitHeaders(rl), request)
  }

  const { guestId, setCookie } = ensureGuestId(request)
  const usage = await getConversionUsage(request, guestId ?? undefined)

  if (usage.kind === 'auth-error') {
    return errorResponse(401, 'unauthorized', 'Session expired. Please sign in again.', undefined, request)
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

  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'dummy') {
    return errorResponse(501, 'not_implemented', 'Vectorization service is not configured on this server.', undefined, request)
  }

  let fileBuffer: Buffer
  let mimeType: string
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return errorResponse(400, 'validation_error', 'No file uploaded', undefined, request)
    }
    
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return errorResponse(400, 'validation_error', 'Only PNG and JPG images are supported', undefined, request)
    }
    mimeType = file.type
    
    const arrayBuffer = await file.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)
    
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return errorResponse(400, 'validation_error', 'File size exceeds 10MB limit', undefined, request)
    }
  } catch (err) {
    return errorResponse(400, 'validation_error', 'Invalid form data', undefined, request)
  }

  try {
    // We use Cloudinary's e_vectorize which returns an SVG format
    const result: any = await uploadImage(fileBuffer, "crushsvg_vectorize", {
      format: 'svg',
      effect: 'vectorize:colors:3:detail:1.0',
    });

    const svgUrl = result.secure_url;
    if (!svgUrl) {
      throw new Error("Failed to get SVG URL from vectorizer");
    }

    // Fetch the generated SVG content
    const svgRes = await fetch(svgUrl);
    if (!svgRes.ok) {
      throw new Error("Failed to fetch generated SVG");
    }
    const svgCode = await svgRes.text();

    let conversionsUsed = 0
    try {
      conversionsUsed = await incrementConversionUsage(request, guestId ?? undefined)
      await logConversion({
        userId: usage.userId,
        guestId: usage.kind === 'guest' ? guestId : undefined,
        inputFormat: mimeType === 'image/png' ? 'png' : 'jpg',
        outputFormat: 'svg',
        success: true,
      })
    } catch (error) {
      console.error('Failed to record conversion usage:', error)
    }

    const nextUsed = usage.kind === 'guest' ? Math.min(GUEST_CONVERSION_LIMIT, usage.count + 1) : undefined
    const remaining = nextUsed !== undefined ? Math.max(0, GUEST_CONVERSION_LIMIT - nextUsed) : undefined

    const acceptsBinary =
      request.headers.get('accept')?.includes('image/svg+xml') ||
      request.nextUrl.searchParams.get('download') === '1'

    if (acceptsBinary) {
      const res = new NextResponse(svgCode, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="vectorized-${Date.now()}.svg"`,
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
        svg: svgCode,
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
    console.error('Vectorize failed:', error)
    
    await logConversion({
      userId: usage.userId,
      guestId: usage.kind === 'guest' ? guestId : undefined,
      inputFormat: mimeType === 'image/png' ? 'png' : 'jpg',
      outputFormat: 'svg',
      success: false,
      errorReason: "vectorization_failed"
    })

    return errorResponse(500, 'vectorization_failed', 'Failed to convert image to SVG', undefined, request)
  }
}
