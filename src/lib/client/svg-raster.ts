import {
  computeTargetSize,
  MAX_OUTPUT_SIZE,
  OutputTooLargeError,
  parseSvgDimensions,
  type SvgDimensions,
} from '@/lib/svg/svg-dims'
import type { ConvertRequest } from '@/lib/client/converter'

/**
 * Browser-side SVG → PNG rasterizer.
 *
 * Why this exists: Vercel Functions reject request/response bodies over
 * 4.5 MB (413 FUNCTION_PAYLOAD_TOO_LARGE) before our route handler runs, so
 * SVGs with large embedded rasters can never reach /api/v1/convert. Those
 * conversions are rendered here instead, with the same output-size rules as the
 * server (see computeTargetSize / MAX_OUTPUT_SIZE).
 *
 * Known differences from the server pipeline:
 *  - "White" is an exact match (the server fast-path just flattens onto white).
 *  - "Transparent" keeps the SVG's own alpha; the server additionally runs its
 *    background-removal engine, which is not available in the browser.
 *  - "Black" / "Custom" paint the colour behind the render instead of replacing
 *    the detected background colour.
 *  - Text uses the visitor's fonts (or fonts embedded in the SVG) rather than
 *    the server's fontconfig set.
 */

const RENDER_TIMEOUT_MS = 60_000
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i

export type BrowserRasterOptions = Pick<
  ConvertRequest,
  'width' | 'height' | 'scale' | 'transparent' | 'bgOption' | 'bgColor' | 'signal'
>

export interface BrowserRasterResult {
  data: string
  mimeType: 'image/png'
  size: number
  format: 'png'
  width: number
  height: number
  warnings: string[]
}

export class BrowserRasterError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'BrowserRasterError'
    this.code = code
  }
}

/** True when the bg option needs the server's background-removal engine to match exactly. */
export function browserRasterApproximatesBackground(options: Pick<ConvertRequest, 'bgOption' | 'transparent'>): boolean {
  return resolveBgOption(options) !== 'White'
}

function resolveBgOption(options: Pick<ConvertRequest, 'bgOption' | 'transparent'>) {
  // Mirrors convertSvg(): explicit bgOption wins, otherwise `transparent` decides.
  return options.bgOption ?? (options.transparent === false ? 'White' : 'Transparent')
}

function resolveFill(options: BrowserRasterOptions): string | null {
  switch (resolveBgOption(options)) {
    case 'White':
      return '#FFFFFF'
    case 'Black':
      return '#000000'
    case 'Custom':
      return options.bgColor && HEX_COLOR_RE.test(options.bgColor) ? options.bgColor : '#FFFFFF'
    default:
      return null
  }
}

const PLAIN_LENGTH_RE = /^\s*\d+(?:\.\d+)?(?:px)?\s*$/i

/**
 * Firefox cannot draw an SVG image onto a canvas when the root element has no
 * usable intrinsic size (e.g. only a viewBox, or width="100%"). Give the root
 * explicit pixel width/height derived from the viewBox in that case. Only the
 * root tag is rewritten; the rest of the (potentially multi-MB) document is
 * left untouched.
 */
function withIntrinsicSize(svg: string, dims: SvgDimensions): string {
  if (!dims.width || !dims.height) return svg
  const rootMatch = /<svg\b[^>]*>/i.exec(svg)
  if (!rootMatch) return svg

  const tag = rootMatch[0]
  const attr = (name: string) =>
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)
  const widthAttr = attr('width')
  const heightAttr = attr('height')
  const hasPlainSize =
    widthAttr !== null &&
    heightAttr !== null &&
    PLAIN_LENGTH_RE.test(widthAttr[1] ?? widthAttr[2] ?? widthAttr[3] ?? '') &&
    PLAIN_LENGTH_RE.test(heightAttr[1] ?? heightAttr[2] ?? heightAttr[3] ?? '')
  if (hasPlainSize) return svg

  const stripped = tag
    .replace(/\swidth\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '')
    .replace(/\sheight\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '')
  const patched = stripped.replace(/^<svg\b/i, `<svg width="${dims.width}" height="${dims.height}"`)
  return svg.slice(0, rootMatch.index) + patched + svg.slice(rootMatch.index + tag.length)
}

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError')
}

function loadImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const img = new Image()
    const cleanup = () => signal?.removeEventListener('abort', onAbort)
    const onAbort = () => {
      img.onload = null
      img.onerror = null
      img.src = ''
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    img.onload = () => {
      cleanup()
      resolve(img)
    }
    img.onerror = () => {
      cleanup()
      reject(
        new BrowserRasterError(
          'invalid_svg',
          "That doesn't look like valid SVG — check your code and try again."
        )
      )
    }
    img.decoding = 'async'
    img.src = url
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new BrowserRasterError('encode_failed', 'Could not read the rendered image.'))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      resolve(comma === -1 ? '' : result.slice(comma + 1))
    }
    reader.readAsDataURL(blob)
  })
}

async function render(svg: string, options: BrowserRasterOptions): Promise<BrowserRasterResult> {
  const { signal } = options
  const dims = parseSvgDimensions(svg)

  let target: ReturnType<typeof computeTargetSize>
  try {
    target = computeTargetSize(dims, {
      width: options.width,
      height: options.height,
      scale: options.scale,
    })
  } catch (error) {
    if (error instanceof OutputTooLargeError) {
      throw new BrowserRasterError(
        'svg_too_large',
        `Output exceeds ${MAX_OUTPUT_SIZE}×${MAX_OUTPUT_SIZE}px. Reduce the size or scale.`
      )
    }
    throw error
  }

  const blob = new Blob([withIntrinsicSize(svg, dims)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url, signal)

    // Source box used for the "contain" fit. Matches the server: explicit
    // width/height/viewBox win, otherwise fall back to the decoded size.
    const srcWidth = dims.width ?? img.naturalWidth
    const srcHeight = dims.height ?? img.naturalHeight
    if (!srcWidth || !srcHeight) {
      throw new BrowserRasterError('invalid_svg', 'This SVG has no usable size. Add width/height or a viewBox.')
    }

    const scale = options.scale ?? 2
    const outWidth = target.width ?? Math.round(srcWidth * scale)
    const outHeight = target.height ?? Math.round(srcHeight * scale)
    if (outWidth > MAX_OUTPUT_SIZE || outHeight > MAX_OUTPUT_SIZE || outWidth < 1 || outHeight < 1) {
      throw new BrowserRasterError(
        'svg_too_large',
        `Output exceeds ${MAX_OUTPUT_SIZE}×${MAX_OUTPUT_SIZE}px. Reduce the size or scale.`
      )
    }

    const canvas = document.createElement('canvas')
    canvas.width = outWidth
    canvas.height = outHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new BrowserRasterError('canvas_unavailable', 'Your browser could not create a drawing surface for this image.')
    }

    const fill = resolveFill(options)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fillRect(0, 0, outWidth, outHeight)
    }

    // "contain": preserve aspect ratio, centred, like sharp's fit: "contain".
    const ratio = Math.min(outWidth / srcWidth, outHeight / srcHeight)
    const drawWidth = srcWidth * ratio
    const drawHeight = srcHeight * ratio
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, (outWidth - drawWidth) / 2, (outHeight - drawHeight) / 2, drawWidth, drawHeight)

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    // Release the pixel buffer right away; these can be 60 MB+ at 4000×4000.
    canvas.width = 0
    canvas.height = 0
    if (!png) {
      throw new BrowserRasterError('encode_failed', 'Could not encode the PNG. Try a smaller size or scale.')
    }
    if (signal?.aborted) throw abortError()

    const data = await blobToBase64(png)
    return {
      data,
      mimeType: 'image/png',
      size: png.size,
      format: 'png',
      width: outWidth,
      height: outHeight,
      warnings: [],
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function rasterizeSvgInBrowser(svg: string, options: BrowserRasterOptions = {}): Promise<BrowserRasterResult> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new BrowserRasterError('conversion_timed_out', 'Conversion took too long. Please try again.')),
      RENDER_TIMEOUT_MS
    )
  })
  try {
    return await Promise.race([render(svg, options), timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
