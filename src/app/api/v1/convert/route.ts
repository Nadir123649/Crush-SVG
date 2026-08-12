import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { convertSchema } from '@/lib/convert-validation'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

function parseSvgForSharp(svg: string): { width?: number; height?: number } {
  const widthMatch = svg.match(/width\s*=\s*["']?([\d.]+)["']?/i)
  const heightMatch = svg.match(/height\s*=\s*["']?([\d.]+)["']?/i)
  const viewBoxMatch = svg.match(/viewBox\s*=\s*["']?[\d\s.]+([\d.]+)["']?/i)

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : undefined,
    height: heightMatch ? parseFloat(heightMatch[1]) : undefined,
  }
}

function sanitizeSvg(svg: string): string {
  let sanitized = svg

  if (!sanitized.includes('xmlns="http://www.w3.org/2000/svg"') &&
      !sanitized.includes("xmlns='http://www.w3.org/2000/svg'")) {
    sanitized = sanitized.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/data:/gi, '')
  sanitized = sanitized.replace(/vbscript:/gi, '')
  sanitized = sanitized.replace(/expression\s*\(/gi, '')

  return sanitized
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit('convert:svg', 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many conversion requests. Try again later.', retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = convertSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return NextResponse.json({ error: first }, { status: 400 })
  }

  const { svg, format, width, scale, transparent, quality } = parsed.data

  try {
    const sharp = (await import('sharp')).default

    const sanitizedSvg = sanitizeSvg(svg)
    const svgBuffer = Buffer.from(sanitizedSvg, 'utf-8')

    const { width: svgWidth, height: svgHeight } = parseSvgForSharp(sanitizedSvg)

    let targetWidth = width
    let targetHeight: number | undefined

    if (targetWidth && svgWidth && svgHeight) {
      targetHeight = Math.round((targetWidth / svgWidth) * svgHeight)
    } else if (!targetWidth && svgWidth) {
      targetWidth = Math.round(svgWidth * scale)
      if (svgHeight) {
        targetHeight = Math.round(svgHeight * scale)
      }
    }

    const pipeline = sharp(svgBuffer, {
      density: 300,
      limitInputPixels: 50_000_000,
    })

    if (targetWidth) {
      pipeline.resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'inside',
        withoutEnlargement: false,
      })
    }

    if (format === 'png') {
      pipeline.png({
        quality,
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
    } else if (format === 'jpeg') {
      pipeline.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      })
      if (!transparent) {
        pipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
      }
    } else if (format === 'webp') {
      pipeline.webp({
        quality,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
      })
    }

    const outputBuffer = await pipeline.toBuffer()
    const base64 = outputBuffer.toString('base64')
    const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`

    return NextResponse.json(
      {
        success: true,
        version: '1.0.0',
        payload: {
          data: base64,
          mimeType,
          size: outputBuffer.length,
          format,
          width: targetWidth,
          height: targetHeight,
        },
        serverTimestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('SVG conversion failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('Input buffer contains unsupported image format')) {
        return NextResponse.json(
          { error: 'That doesn\'t look like valid SVG — check your code and try again.' },
          { status: 422 }
        )
      }
      if (error.message.includes('limitInputPixels')) {
        return NextResponse.json(
          { error: 'SVG dimensions too large. Maximum 8192px.' },
          { status: 422 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Conversion failed. Please try again.' },
      { status: 500 }
    )
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