import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { auth } from '@/lib/auth-middleware'
import { uploadImage } from '@/lib/cloudinary'
import { convertSvgQueued } from '@/lib/conversion-queue'
import { convertSchema } from '@/lib/convert-validation'
import {
  getConversionUsage,
  incrementConversionUsage,
  GUEST_CONVERSION_LIMIT,
} from '@/lib/conversion-usage'
import { getGuestId } from '@/lib/guest-usage'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { UploadApiResponse } from 'cloudinary'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024

function sanitizePublicId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'uploads', 30, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many upload requests. Try again later.', rateLimitHeaders(rl))
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse(400, 'invalid_upload', 'Invalid multipart upload.', undefined, request)
  }
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 10MB.' },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === 'image/svg+xml') {
    return convertSvgUpload(request, formData, buffer)
  }

  return rawUpload(request, buffer)
}

async function convertSvgUpload(request: NextRequest, formData: FormData, buffer: Buffer) {
  const usage = await getConversionUsage(request)
  if (usage.kind === 'guest' && usage.limitReached) {
    return errorResponse(
      429,
      'limit_reached',
      "You've used your 3 free conversions. Create a free account to keep converting."
    )
  }

  const rawWidth = formData.get('width')
  const rawScale = formData.get('scale')
  const rawTransparent = formData.get('transparent')

  const parsed = convertSchema
    .omit({ svg: true })
    .safeParse({
      width: rawWidth ? Number(rawWidth) : undefined,
      scale: rawScale ? Number(rawScale) : undefined,
      transparent: rawTransparent === 'true' || rawTransparent === '1',
      format: 'png',
    })
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return errorResponse(400, 'validation_error', first)
  }

  const { width, scale, transparent } = parsed.data

  try {
    const result = await convertSvgQueued(buffer.toString('utf-8'), {
      format: 'png',
      width,
      scale,
      transparent,
    })

    const idPrefix = sanitizePublicId(usage.userId ?? `guest_${getGuestId(request) ?? 'anon'}`)
    const uploaded = (await uploadImage(result.buffer, 'crushsvg/conversions', {
      public_id: `conv_${idPrefix}_${Date.now()}`,
    })) as UploadApiResponse

    const conversionsUsed = await incrementConversionUsage(request)
    const remaining =
      usage.kind === 'guest' ? Math.max(0, GUEST_CONVERSION_LIMIT - conversionsUsed) : undefined

    return successResponse({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: result.width,
      height: result.height,
      size: result.buffer.length,
      format: 'png',
      conversionsUsed,
      remaining,
    })
  } catch (error) {
    logger.error('svg_upload_conversion_failed', { requestId: request.headers.get('x-request-id'), error: error instanceof Error ? error.message : String(error) })

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

async function rawUpload(request: NextRequest, buffer: Buffer) {
  const who = await auth(request)
  if ('error' in who) return who.error

  try {
    const result = (await uploadImage(buffer, 'crushsvg/uploads', {
      public_id: `${sanitizePublicId(who.user.id)}_${Date.now()}`,
    })) as UploadApiResponse

    return successResponse(
      {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
      200,
      undefined,
      request
    )
  } catch (error) {
    logger.error('raw_upload_failed', { requestId: request.headers.get('x-request-id'), error: error instanceof Error ? error.message : String(error) })
    return errorResponse(500, 'upload_failed', 'Upload failed', undefined, request)
  }
}
