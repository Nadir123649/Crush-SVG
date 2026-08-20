import { MAX_OUTPUT_SIZE, OutputTooLargeError } from '@/lib/svg/svg-dims'

export class ConversionTimeoutError extends Error {
  constructor() {
    super('Conversion timed out')
    this.name = 'ConversionTimeoutError'
  }
}

export interface SvgErrorInfo {
  status: 422 | 503 | 500
  code: string
  message: string
}

const MAX_LABEL = `${MAX_OUTPUT_SIZE}×${MAX_OUTPUT_SIZE}px`

/**
 * Maps sharp / librsvg failures to user-facing API errors. Shared by the
 * convert and uploads routes so error behavior stays consistent. Unknown
 * failures fall through to a generic 500.
 */
export function classifySvgError(error: unknown): SvgErrorInfo {
  if (error instanceof OutputTooLargeError) {
    return {
      status: 422,
      code: 'svg_too_large',
      message: `Output exceeds ${MAX_LABEL}. Reduce the size or scale.`,
    }
  }

  if (error instanceof ConversionTimeoutError) {
    return {
      status: 503,
      code: 'conversion_timed_out',
      message: 'Conversion took too long. Please try again.',
    }
  }

  const message = error instanceof Error ? error.message : String(error)
  const low = message.toLowerCase()

  if (/pixel limit/.test(low)) {
    return {
      status: 422,
      code: 'svg_too_large',
      message: `SVG dimensions too large. Maximum ${MAX_LABEL}.`,
    }
  }

  if (/unsupported image format/.test(low)) {
    return {
      status: 422,
      code: 'invalid_svg',
      message: "That doesn't look like valid SVG — check your code and try again.",
    }
  }

  if (/corrupt header|xml parse error|expected end tag|mismatched tag|unexpected eof|invalid tag|no such element/.test(low)) {
    return {
      status: 422,
      code: 'invalid_svg',
      message:
        'Your SVG markup is malformed — check for unclosed tags or mismatched quotes and try again.',
    }
  }

  if (/unable to load font|fontconfig|no fonts found|unknown font/.test(low)) {
    return {
      status: 422,
      code: 'svg_font_error',
      message:
        "Your SVG uses a font that isn't available on the server — convert text to paths (outline the font) or use a standard web font.",
    }
  }

  if (/out of memory|unable to allocate|enomem/.test(low)) {
    return {
      status: 422,
      code: 'svg_too_complex',
      message: 'SVG is too complex to render — try a smaller size or simplify the image.',
    }
  }

  if (/timed out|timeout/i.test(low)) {
    return {
      status: 503,
      code: 'conversion_timed_out',
      message: 'Conversion took too long. Please try again.',
    }
  }

  return {
    status: 500,
    code: 'conversion_failed',
    message: 'Conversion failed. Please try again.',
  }
}