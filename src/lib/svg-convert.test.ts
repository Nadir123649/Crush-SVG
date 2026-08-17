import { describe, expect, it } from 'vitest'

import { convertSvg, parseSvgForSharp, sanitizeSvg } from '@/lib/svg-convert'

const SIMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'

describe('sanitizeSvg', () => {
  it('adds the SVG namespace when missing', () => {
    const out = sanitizeSvg('<svg width="10" height="10"></svg>')
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('strips script blocks', () => {
    const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    expect(out).not.toContain('<script')
  })

  it('strips event handler attributes', () => {
    const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"></svg>')
    expect(out).not.toContain('onclick')
  })

  it('strips javascript:, data:, vbscript: and expression() payloads', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">x</a><a href="data:text/html">y</a></svg>'
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('data:')
  })
})

describe('parseSvgForSharp', () => {
  it('reads width and height attributes', () => {
    const dims = parseSvgForSharp('<svg width="240" height="160"></svg>')
    expect(dims).toEqual({ width: 240, height: 160 })
  })

  it('falls back to viewBox dimensions when attributes are missing', () => {
    const dims = parseSvgForSharp('<svg viewBox="0 0 120 120"></svg>')
    expect(dims).toEqual({ width: 120, height: 120 })
  })

  it('uses viewBox size when only one attribute exists', () => {
    const dims = parseSvgForSharp('<svg width="240" viewBox="0 0 120 120"></svg>')
    expect(dims).toEqual({ width: 120, height: 120 })
  })
})

describe('convertSvg', () => {
  it('renders a PNG buffer with correct dimensions', async () => {
    const result = await convertSvg(SIMPLE_SVG, { width: 200 })
    expect(result.format).toBe('png')
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
    const magic = result.buffer.subarray(0, 8).toString('hex')
    expect(magic).toBe('89504e470d0a1a0a')
  })

  it('defaults scale to 2x when no width given', async () => {
    const result = await convertSvg(SIMPLE_SVG, {})
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
  })

  it('renders a JPEG buffer when requested', async () => {
    const result = await convertSvg(SIMPLE_SVG, { format: 'jpeg', width: 100 })
    expect(result.format).toBe('jpeg')
    const magic = result.buffer.subarray(0, 2).toString('hex')
    expect(magic).toBe('ffd8')
  })

  it('renders a WebP buffer when requested', async () => {
    const result = await convertSvg(SIMPLE_SVG, { format: 'webp', width: 100 })
    expect(result.format).toBe('webp')
    expect(result.buffer.subarray(0, 4).toString('ascii')).toBe('RIFF')
    expect(result.buffer.subarray(8, 12).toString('ascii')).toBe('WEBP')
  })

  it('rejects content that is not an SVG', async () => {
    await expect(convertSvg('not an svg at all', {})).rejects.toThrow()
  })
})
