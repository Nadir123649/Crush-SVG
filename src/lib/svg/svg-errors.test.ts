import { describe, expect, it } from 'vitest'

import { classifySvgError, ConversionTimeoutError } from '@/lib/svg/svg-errors'
import { OutputTooLargeError } from '@/lib/svg/svg-dims'

describe('classifySvgError', () => {
  it('maps OutputTooLargeError to 422 svg_too_large', () => {
    const info = classifySvgError(new OutputTooLargeError('width', 5000))
    expect(info.status).toBe(422)
    expect(info.code).toBe('svg_too_large')
    expect(info.message).toContain('4000×4000px')
  })

  it('maps ConversionTimeoutError to 503', () => {
    const info = classifySvgError(new ConversionTimeoutError())
    expect(info.status).toBe(503)
    expect(info.code).toBe('conversion_timed_out')
  })

  it('maps sharp pixel-limit errors to 422 svg_too_large', () => {
    const info = classifySvgError(new Error('Input image exceeds pixel limit'))
    expect(info.status).toBe(422)
    expect(info.code).toBe('svg_too_large')
  })

  it('maps the SVG scale-limit error to 422 svg_too_large', () => {
    const info = classifySvgError(
      new Error('Input SVG image will exceed 32767x32767 pixel limit when scaled')
    )
    expect(info.status).toBe(422)
    expect(info.code).toBe('svg_too_large')
  })

  it('maps unsupported-format errors to 422 invalid_svg', () => {
    const info = classifySvgError(new Error('Input buffer contains unsupported image format'))
    expect(info.status).toBe(422)
    expect(info.code).toBe('invalid_svg')
  })

  it('maps XML parse errors to 422 invalid_svg', () => {
    const info = classifySvgError(new Error('Input buffer has corrupt header: glib: XML parse error'))
    expect(info.status).toBe(422)
    expect(info.code).toBe('invalid_svg')
  })

  it('maps missing-font errors to 422 svg_font_error', () => {
    const info = classifySvgError(new Error('VipsError: unable to load font "Comic Sans"'))
    expect(info.status).toBe(422)
    expect(info.code).toBe('svg_font_error')
  })

  it('maps out-of-memory errors to 422 svg_too_complex', () => {
    const info = classifySvgError(new Error('VipsError: out of memory'))
    expect(info.status).toBe(422)
    expect(info.code).toBe('svg_too_complex')
  })

  it('maps timeout messages to 503', () => {
    const info = classifySvgError(new Error('job wait timeout'))
    expect(info.status).toBe(503)
    expect(info.code).toBe('conversion_timed_out')
  })

  it('falls through to a generic 500 for unknown errors', () => {
    const info = classifySvgError(new Error('something unexpected'))
    expect(info.status).toBe(500)
    expect(info.code).toBe('conversion_failed')
  })

  it('handles non-Error inputs', () => {
    const info = classifySvgError('boom')
    expect(info.status).toBe(500)
    expect(info.code).toBe('conversion_failed')
  })
})