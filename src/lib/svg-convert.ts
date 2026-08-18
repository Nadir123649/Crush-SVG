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
  sanitized = sanitized.replace(/vbscript:/gi, '')
  sanitized = sanitized.replace(/data:/gi, '')
  sanitized = sanitized.replace(/expression\s*\(/gi, '')

  // Fix for Figma image patterns (librsvg bug where <use> cannot reference <image> reliably)
  const imageRegex = /<image\s+id=["']([^"']+)["'][^>]*\/>/gi
  let match
  const images = new Map<string, string>()
  while ((match = imageRegex.exec(sanitized)) !== null) {
    images.set(match[1], match[0])
  }

  if (images.size > 0) {
    sanitized = sanitized.replace(
      /<use\s+xlink:href=["']#([^"']+)["']([^>]*)\/>/gi,
      (fullMatch, id, rest) => {
        const imgTag = images.get(id)
        if (imgTag) {
          // Inline the image and apply the <use> attributes (like transform)
          return imgTag.replace(/<image\s+id=["'][^"']+["']/, `<image ${rest}`)
        }
        return fullMatch
      }
    )
  }

  return sanitized
}

export function parseSvgForSharp(svg: string): { width?: number; height?: number } {
  const widthMatch = svg.match(/<svg[^>]*\bwidth\s*=\s*["']?([\d.]+)(px)?["']?/i)
  const heightMatch = svg.match(/<svg[^>]*\bheight\s*=\s*["']?([\d.]+)(px)?["']?/i)

  if (widthMatch && heightMatch) {
    return {
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
    }
  }

  const viewBoxMatch = svg.match(
    /viewBox\s*=\s*["']?\s*(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*["']?/i
  )
  if (viewBoxMatch) {
    return {
      width: parseFloat(viewBoxMatch[3]),
      height: parseFloat(viewBoxMatch[4]),
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

  let targetWidth: number | undefined
  let targetHeight: number | undefined

  if (options.width) {
    targetWidth = Math.round(options.width)
    if (svgWidth && svgHeight) {
      targetHeight = Math.round((targetWidth / svgWidth) * svgHeight)
    }
  } else if (svgWidth && svgHeight) {
    targetWidth = Math.round(svgWidth * scale)
    targetHeight = Math.round(svgHeight * scale)
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

  if (options.transparent === false || format === 'jpeg') {
    pipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
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
