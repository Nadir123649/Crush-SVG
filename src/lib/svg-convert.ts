import 'server-only'

import sharp from 'sharp'

import { sanitizeSvg } from '@/lib/svg-sanitize'
import { computeTargetSize, parseSvgDimensions } from '@/lib/svg-dims'
import { ConversionTimeoutError } from '@/lib/svg-errors'

export type SvgFormat = 'png'

export interface SvgConvertOptions {
  width?: number
  height?: number
  scale?: number
  transparent?: boolean
  quality?: number
}

export interface SvgConvertResult {
  buffer: Buffer
  width?: number
  height?: number
  format: SvgFormat
  warnings: string[]
}

export const CONVERSION_TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ConversionTimeoutError()), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export async function convertSvg(
  svg: string,
  options: SvgConvertOptions = {}
): Promise<SvgConvertResult> {
  const quality = options.quality ?? 90

  const sanitizedSvg = sanitizeSvg(svg)
  const dims = parseSvgDimensions(sanitizedSvg)
  const target = computeTargetSize(dims, options)

  const warnings: string[] = []

  const pipeline = sharp(Buffer.from(sanitizedSvg, 'utf-8'), {
    density: 300,
    limitInputPixels: 50_000_000,
  })

  if (target.width) {
    pipeline.resize({
      width: target.width,
      height: target.height,
      fit: target.fit,
      withoutEnlargement: false,
      background: {
        r: 255,
        g: 255,
        b: 255,
        alpha: options.transparent === false ? 1 : 0,
      },
    })
  }

  if (options.transparent === false) {
    pipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
  }

  pipeline.png({
    quality,
    compressionLevel: 9,
    adaptiveFiltering: true,
  })

  const { data: buffer, info } = await withTimeout(
    pipeline.toBuffer({ resolveWithObject: true }),
    CONVERSION_TIMEOUT_MS
  )

  return { buffer, width: info.width, height: info.height, format: 'png', warnings }
}