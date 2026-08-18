import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  convertSvg: vi.fn(),
  getConversionUsage: vi.fn(),
  incrementConversionUsage: vi.fn(),
}))

vi.mock('@/lib/svg-convert', () => ({
  convertSvg: mocks.convertSvg,
}))
vi.mock('@/lib/conversion-usage', () => ({
  getConversionUsage: mocks.getConversionUsage,
  incrementConversionUsage: mocks.incrementConversionUsage,
  GUEST_CONVERSION_LIMIT: 3,
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
}))

import { POST } from './route'

const SVG_BODY = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>',
  format: 'png',
  width: 480,
  scale: 2,
  transparent: true,
  quality: 90,
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest('http://localhost/api/v1/convert', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.convertSvg.mockResolvedValue({
    buffer: Buffer.from('converted-bytes'),
    width: 480,
    height: 480,
    format: 'png',
  })
  mocks.getConversionUsage.mockResolvedValue({
    kind: 'guest',
    count: 1,
    limit: 3,
    remaining: 2,
    limitReached: false,
  })
  mocks.incrementConversionUsage.mockResolvedValue(2)
})

describe('POST /api/v1/convert', () => {
  it('converts SVG and returns base64 PNG with usage counters', async () => {
    const res = await post(SVG_BODY)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.payload.data).toBe(Buffer.from('converted-bytes').toString('base64'))
    expect(body.payload.mimeType).toBe('image/png')
    expect(body.payload.width).toBe(480)
    expect(body.payload.conversionsUsed).toBe(2)
    expect(body.payload.remaining).toBe(1)
    expect(mocks.convertSvg).toHaveBeenCalledWith(
      SVG_BODY.svg,
      expect.objectContaining({ format: 'png', width: 480, scale: 2 })
    )
    expect(mocks.incrementConversionUsage).toHaveBeenCalled()
  })

  it('blocks guests who reached the 3-conversion limit', async () => {
    mocks.getConversionUsage.mockResolvedValue({
      kind: 'guest',
      count: 3,
      limit: 3,
      remaining: 0,
      limitReached: true,
    })
    const res = await post(SVG_BODY)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.payload.error.code).toBe('limit_reached')
    expect(mocks.convertSvg).not.toHaveBeenCalled()
  })

  it('lets authenticated users convert without limit', async () => {
    mocks.getConversionUsage.mockResolvedValue({
      kind: 'user',
      count: 99,
      limit: null,
      remaining: null,
      limitReached: false,
      userId: '507f1f77bcf86cd799439011',
    })
    const res = await post(SVG_BODY)
    expect(res.status).toBe(200)
    expect(mocks.convertSvg).toHaveBeenCalled()
  })

  it('returns 400 for invalid SVG input', async () => {
    const res = await post({ svg: '', format: 'png' })
    expect(res.status).toBe(400)
    expect(mocks.convertSvg).not.toHaveBeenCalled()
  })

  it('returns 422 with friendly message for non-SVG input', async () => {
    mocks.convertSvg.mockRejectedValue(new Error('Input buffer contains unsupported image format'))
    const res = await post(SVG_BODY)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.payload.error.code).toBe('invalid_svg')
    expect(body.payload.error.message).toContain("doesn't look like valid SVG")
  })

  it('returns 422 with malformed-markup reason for corrupt XML', async () => {
    mocks.convertSvg.mockRejectedValue(new Error('Input buffer has corrupt header: glib: XML parse error'))
    const res = await post(SVG_BODY)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.payload.error.code).toBe('invalid_svg')
    expect(body.payload.error.message).toContain('malformed')
  })

  it('returns 422 with font reason when the SVG uses an unavailable font', async () => {
    mocks.convertSvg.mockRejectedValue(new Error('VipsError: unable to load font "Comic Sans"'))
    const res = await post(SVG_BODY)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.payload.error.code).toBe('svg_font_error')
    expect(body.payload.error.message).toContain("font that isn't available")
  })

  it('returns 422 with complexity reason on out-of-memory failures', async () => {
    mocks.convertSvg.mockRejectedValue(new Error('VipsError: out of memory'))
    const res = await post(SVG_BODY)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.payload.error.code).toBe('svg_too_complex')
    expect(body.payload.error.message).toContain('too complex')
  })

  it('returns 503 when the conversion times out', async () => {
    mocks.convertSvg.mockRejectedValue(new Error('job wait timeout'))
    const res = await post(SVG_BODY)
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.payload.error.code).toBe('conversion_timed_out')
    expect(body.payload.error.message).toContain('took too long')
  })

  it('returns 500 with a generic message for unknown failures', async () => {
    mocks.convertSvg.mockRejectedValue(new Error('something unexpected'))
    const res = await post(SVG_BODY)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.payload.error.code).toBe('conversion_failed')
  })
})
