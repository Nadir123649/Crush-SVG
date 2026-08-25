import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { getConversionUsage, incrementConversionUsage, GUEST_CONVERSION_LIMIT } from '@/lib/usage/conversion-usage'
import { logConversion } from '@/lib/usage/conversion-logger'
import { ensureGuestId, GUEST_COOKIE_NAME } from '@/lib/usage/guest-usage'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import sharp from 'sharp'
// @ts-ignore
import ImageTracer from '@/lib/utils/imagetracer'

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
  let quality: string = 'Medium'
  let colors: string = 'Auto'
  let background: string = 'Preserve'
  let bgColor: string = '#ffffff'
  let pathOpt: string = 'Balanced'
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    quality = formData.get('quality') as string || 'Medium'
    colors = formData.get('colors') as string || 'Auto'
    background = formData.get('background') as string || 'Preserve'
    bgColor = formData.get('bgColor') as string || '#ffffff'
    pathOpt = formData.get('pathOpt') as string || 'Balanced'
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
    let sharpInstance = sharp(fileBuffer);
    
    // Apply background color if 'Custom' is selected
    if (background === 'Custom') {
        sharpInstance = sharpInstance.flatten({ background: bgColor });
    }
    
    // Get raw RGBA pixels
    const { data, info } = await sharpInstance
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const imgData = { 
        width: info.width, 
        height: info.height, 
        data: new Uint8ClampedArray(data) 
    };

    const options: any = {
      layering: 0,
      strokewidth: 1, // Adds a 1px stroke of the same color to fill any gaps (prevents tearing)
    };

    // Map quality to detail settings
    if (quality === 'Low') {
      options.ltres = 1;
      options.qtres = 1;
      options.pathomit = 16;
    } else if (quality === 'High') {
      options.ltres = 0.1;
      options.qtres = 0.1;
      options.pathomit = 0;
    } else { // Medium
      options.ltres = 0.5;
      options.qtres = 0.5;
      options.pathomit = 8;
    }

    // Map colors
    if (colors === 'Limited') {
      options.numberofcolors = 16;
    } else if (colors === 'Full') {
      options.numberofcolors = 128; // Increased for better full color
    } else { // Auto
      options.numberofcolors = 64; // Increased from 16 to 64 for better defaults
    }

    // Map path optimization
    if (pathOpt === 'Off') {
      options.blurradius = 0;
    } else if (pathOpt === 'Maximum') {
      options.blurradius = 5;
      options.blurdelta = 64;
    } else { // Balanced
      options.blurradius = 0; // Removing the 1px blur prevents edges from degrading
      options.blurdelta = 20;
    }

    // Vectorize!
    const svgCode = ImageTracer.imagedataToSVG(imgData, options);

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

  } catch (error: any) {
    console.error('Vectorization failed:', error)
    // Write error to a scratch file so I can read it!
    try {
      require('fs').writeFileSync('./scratch/vectorize-error.txt', String(error?.stack || error));
    } catch(e){}
    
    await logConversion({
      userId: usage.userId,
      guestId: usage.kind === 'guest' ? guestId : undefined,
      inputFormat: mimeType === 'image/png' ? 'png' : 'jpg',
      outputFormat: 'svg',
      success: false,
      errorReason: "vectorization_failed"
    })

    return errorResponse(500, 'vectorization_error', 'Vectorization failed. Please try again.', undefined, request)
  }
}
