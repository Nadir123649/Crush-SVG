import 'server-only'

import sharp from 'sharp'

export type SvgFormat = 'png' | 'jpeg' | 'webp'

export interface SvgConvertOptions {
  format?: SvgFormat
  width?: number
  scale?: number
  transparent?: boolean
  quality?: number
}

export interface SvgConvertResult {
  buffer: Buffer
  width?: number
  height?: number
  format: SvgFormat
}

export function sanitizeSvg(svg: string): string {
  let sanitized = svg

  if (
    !sanitized.includes('xmlns="http://www.w3.org/2000/svg"') &&
    !sanitized.includes("xmlns='http://www.w3.org/2000/svg'")
  ) {
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

export function parseSvgForSharp(svg: string): { width?: number; height?: number } {
  const widthMatch = svg.match(/width\s*=\s*["']?([\d.]+)["']?/i)
  const heightMatch = svg.match(/height\s*=\s*["']?([\d.]+)["']?/i)

  if (widthMatch && heightMatch) {
    return {
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
    }
  }

  const viewBoxMatch = svg.match(
    /viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']?/i
  )
  if (viewBoxMatch) {
    return {
      width: parseFloat(viewBoxMatch[1]),
      height: parseFloat(viewBoxMatch[2]),
    }
  }

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : undefined,
    height: heightMatch ? parseFloat(heightMatch[1]) : undefined,
  }
}

export async function convertSvg(
  svg: string,
  options: SvgConvertOptions = {}
): Promise<SvgConvertResult> {
  const format = options.format ?? 'png'
  const scale = options.scale ?? 2
  const quality = options.quality ?? 90

  const sanitizedSvg = sanitizeSvg(svg)
  const svgBuffer = Buffer.from(sanitizedSvg, 'utf-8')

  const { width: svgWidth, height: svgHeight } = parseSvgForSharp(sanitizedSvg)

  let targetWidth = options.width
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
    if (options.transparent === false) {
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

  const buffer = await pipeline.toBuffer()
  return { buffer, width: targetWidth, height: targetHeight, format }
}
