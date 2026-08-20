import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

import { convertSvg } from '@/lib/svg/svg-convert'
import { parseSvgDimensions, OutputTooLargeError } from '@/lib/svg/svg-dims'
import { sanitizeSvg } from '@/lib/svg/svg-sanitize'

const SIMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'

const TRANSPARENT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="25" y="25" width="50" height="50" fill="red"/></svg>'

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures', 'svgs')

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

  it('strips unquoted event handler attributes', () => {
    const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload=alert(1)></svg>')
    expect(out).not.toContain('onload')
  })

  it('strips javascript:, data:, vbscript: and expression() payloads', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">x</a><a href="data:text/html">y</a></svg>'
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('data:')
  })

  it('preserves embedded base64 images in href attributes', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="/></svg>'
    const out = sanitizeSvg(svg)
    expect(out).toContain('data:image/png;base64,')
  })

  it('leaves text content containing data: untouched', () => {
    const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><text>my data: here</text></svg>')
    expect(out).toContain('my data: here')
  })
})

describe('parseSvgDimensions', () => {
  it('reads width and height attributes', () => {
    const dims = parseSvgDimensions('<svg width="240" height="160"></svg>')
    expect(dims).toEqual({ width: 240, height: 160 })
  })

  it('falls back to viewBox dimensions when attributes are missing', () => {
    const dims = parseSvgDimensions('<svg viewBox="0 0 120 120"></svg>')
    expect(dims).toEqual({ width: 120, height: 120 })
  })

  it('uses viewBox size when only one attribute exists', () => {
    const dims = parseSvgDimensions('<svg width="240" viewBox="0 0 120 120"></svg>')
    expect(dims).toEqual({ width: 120, height: 120 })
  })

  it('ignores percentage and unit lengths', () => {
    expect(parseSvgDimensions('<svg width="100%" height="50%" viewBox="0 0 200 100"></svg>')).toEqual({
      width: 200,
      height: 100,
    })
    expect(parseSvgDimensions('<svg width="10em" height="5em"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
  })

  it('returns undefined for svg without dimensions', () => {
    expect(parseSvgDimensions('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
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

  it('rejects content that is not an SVG', async () => {
    await expect(convertSvg('not an svg at all', {})).rejects.toThrow()
  })

  it('rejects output wider than 4000px', async () => {
    await expect(convertSvg(SIMPLE_SVG, { width: 5000 })).rejects.toThrow(OutputTooLargeError)
  })

  it('rejects output taller than 4000px', async () => {
    const tall = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1000"><rect width="1" height="1000" fill="red"/></svg>'
    await expect(convertSvg(tall, { width: 4000 })).rejects.toThrow(OutputTooLargeError)
  })

  it('allows the maximum 4000x4000 output', async () => {
    const result = await convertSvg(SIMPLE_SVG, { width: 4000, height: 4000 })
    expect(result.width).toBe(4000)
    expect(result.height).toBe(4000)
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

  it('applies an exact width and height when both are given', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="purple"/></svg>'
    const result = await convertSvg(svg, { width: 400, height: 200 })
    expect(result.width).toBe(400)
    expect(result.height).toBe(200)
  })

  it('pads the canvas to the exact requested size when the aspect ratio differs', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="orange"/></svg>'
    const result = await convertSvg(svg, { width: 400, height: 400 })
    expect(result.width).toBe(400)
    expect(result.height).toBe(400)
    const corner = await pixelAt(result.buffer, 0, 0)
    expect(corner.a).toBe(0)
    const center = await pixelAt(result.buffer, 200, 200)
    expect(center.r).toBeGreaterThan(230)
    expect(center.g).toBeGreaterThan(100)
    expect(center.b).toBeLessThan(60)
  })
})

async function opaqueRatio(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels
  let opaque = 0
  for (let i = 3; i < data.length; i += channels) {
    if (data[i] > 0) opaque++
  }
  return opaque / (info.width * info.height)
}

describe('real-world SVG fixtures', () => {
  const fixtures = [
    'bank (1).svg',
    'cards (1).svg',
    'check (1).svg',
    'chevron-right (2).svg',
    'circle (1).svg',
    'money (1).svg',
    'phone (1).svg',
    'star (1).svg',
    'tick (1).svg',
    'white-circle (1).svg',
  ]

  for (const file of fixtures) {
    it(`converts ${file} to a non-blank PNG`, async () => {
      const svg = readFileSync(path.join(FIXTURES_DIR, file), 'utf-8')
      const result = await convertSvg(svg, { scale: 1 })

      expect(result.format).toBe('png')
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)

      const ratio = await opaqueRatio(result.buffer)
      expect(ratio).toBeGreaterThan(0.01)
    })
  }

  it('renders the embedded logo in the Figma pattern SVGs', async () => {
    for (const file of ['bank (1).svg', 'money (1).svg', 'star (1).svg']) {
      const svg = readFileSync(path.join(FIXTURES_DIR, file), 'utf-8')
      const result = await convertSvg(svg, { scale: 1 })
      const ratio = await opaqueRatio(result.buffer)
      expect(ratio).toBeGreaterThan(0.05)
    }
  })
})