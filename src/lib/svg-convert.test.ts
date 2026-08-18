import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

import { convertSvg, parseSvgForSharp, sanitizeSvg } from '@/lib/svg-convert'

const SIMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'

const TRANSPARENT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="25" y="25" width="50" height="50" fill="red"/></svg>'

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

async function pixelAt(
  buffer: Buffer,
  x: number,
  y: number
): Promise<{ r: number; g: number; b: number; a: number }> {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels
  const idx = (y * info.width + x) * channels
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: channels >= 4 ? data[idx + 3] : 255,
  }
}

describe('convertSvg transparency', () => {
  it('keeps the transparent background for PNG by default', async () => {
    const result = await convertSvg(TRANSPARENT_SVG, { width: 100 })
    const corner = await pixelAt(result.buffer, 0, 0)
    expect(corner.a).toBe(0)
  })

  it('flattens PNG to white when transparent is false', async () => {
    const result = await convertSvg(TRANSPARENT_SVG, { width: 100, transparent: false })
    const corner = await pixelAt(result.buffer, 0, 0)
    expect(corner).toEqual({ r: 255, g: 255, b: 255, a: 255 })
  })

  it('always flattens JPEG to white even when transparent is requested', async () => {
    const result = await convertSvg(TRANSPARENT_SVG, { format: 'jpeg', width: 100, transparent: true })
    const corner = await pixelAt(result.buffer, 0, 0)
    expect(corner.a).toBe(255)
    expect(corner.r).toBeGreaterThan(250)
    expect(corner.g).toBeGreaterThan(250)
    expect(corner.b).toBeGreaterThan(250)
  })

  it('keeps alpha for WebP when transparent', async () => {
    const result = await convertSvg(TRANSPARENT_SVG, { format: 'webp', width: 100 })
    const corner = await pixelAt(result.buffer, 0, 0)
    expect(corner.a).toBe(0)
  })

  it('flattens WebP to white when transparent is false', async () => {
    const result = await convertSvg(TRANSPARENT_SVG, { format: 'webp', width: 100, transparent: false })
    const corner = await pixelAt(result.buffer, 0, 0)
    expect(corner).toEqual({ r: 255, g: 255, b: 255, a: 255 })
  })
})

describe('convertSvg width and scale', () => {
  it('applies scale to viewBox-only SVGs', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect width="50" height="50" fill="blue"/></svg>'
    const result = await convertSvg(svg, { scale: 2 })
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)
  })

  it('resizes width-only SVGs when a width is requested', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100"><rect width="100" height="100" fill="green"/></svg>'
    const result = await convertSvg(svg, { width: 200 })
    expect(result.width).toBe(200)
  })
})
