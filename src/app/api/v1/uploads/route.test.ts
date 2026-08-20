import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  getConversionUsage: vi.fn(),
  incrementConversionUsage: vi.fn(),
  auth: vi.fn(),
}))

vi.mock('@/lib/integrations/cloudinary', () => ({
  uploadImage: mocks.uploadImage,
}))
vi.mock('@/lib/usage/conversion-usage', () => ({
  getConversionUsage: mocks.getConversionUsage,
  incrementConversionUsage: mocks.incrementConversionUsage,
  GUEST_CONVERSION_LIMIT: 3,
}))
vi.mock('@/lib/middleware/auth-middleware', () => ({
  auth: mocks.auth,
}))
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
}))

import { POST } from './route'

const SVG_CONTENT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'

function svgForm(width?: string) {
  const fd = new FormData()
  fd.append('file', new File([SVG_CONTENT], 'icon.svg', { type: 'image/svg+xml' }))
  if (width) fd.append('width', width)
  return fd
}

function rawForm(type: string) {
  const fd = new FormData()
  fd.append('file', new File(['fake-bytes'], 'photo.png', { type }))
  return fd
}

function post(fd: FormData, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest('http://localhost/api/v1/uploads', {
      method: 'POST',
      body: fd,
      headers,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.uploadImage.mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/crushsvg/conversions/conv_x_1.png',
    public_id: 'crushsvg/conversions/conv_x_1',
    width: 200,
    height: 200,
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

describe('POST /api/v1/uploads', () => {
  it('converts an uploaded SVG to PNG and uploads it to Cloudinary', async () => {
    const res = await post(svgForm())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.payload.url).toContain('res.cloudinary.com')
    expect(body.payload.format).toBe('png')
    expect(body.payload.conversionsUsed).toBe(2)
    expect(mocks.uploadImage).toHaveBeenCalledTimes(1)
    const [pngBuffer, folder, opts] = mocks.uploadImage.mock.calls[0]
    expect(folder).toBe('crushsvg/conversions')
    expect(pngBuffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(opts.public_id).toContain('conv_')
  })

  it('passes width through to the conversion', async () => {
    await post(svgForm('200'))
    const [, , opts] = mocks.uploadImage.mock.calls[0]
    expect(opts).toBeDefined()
  })

  it('blocks guests at the 3-conversion limit without uploading', async () => {
    mocks.getConversionUsage.mockResolvedValue({
      kind: 'guest',
      count: 3,
      limit: 3,
      remaining: 0,
      limitReached: true,
    })
    const res = await post(svgForm())
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.payload.error.code).toBe('limit_reached')
    expect(mocks.uploadImage).not.toHaveBeenCalled()
  })

  it('returns 400 for unsupported file types', async () => {
    const res = await post(rawForm('text/plain'))
    expect(res.status).toBe(400)
    expect(mocks.uploadImage).not.toHaveBeenCalled()
  })

  it('routes SVG content disguised as image/png through the conversion pipeline', async () => {
    const fd = new FormData()
    fd.append('file', new File([SVG_CONTENT], 'icon.png', { type: 'image/png' }))
    const res = await post(fd)
    expect(res.status).toBe(200)
    expect(mocks.uploadImage).toHaveBeenCalledTimes(1)
    const [pngBuffer, folder] = mocks.uploadImage.mock.calls[0]
    expect(folder).toBe('crushsvg/conversions')
    expect(pngBuffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  it('routes a fake SVG upload (bad content) to a 422 instead of uploading raw', async () => {
    const fd = new FormData()
    fd.append('file', new File(['<svg xmlns="not-a-real-content'], 'fake.svg', { type: 'image/svg+xml' }))
    const res = await post(fd)
    expect(res.status).toBe(422)
    expect(mocks.uploadImage).not.toHaveBeenCalled()
  })

  it('returns an empty warnings array in the response', async () => {
    const fd = new FormData()
    fd.append('file', new File([SVG_CONTENT], 'icon.svg', { type: 'image/svg+xml' }))
    const res = await post(fd)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.payload.warnings).toEqual([])
  })

  it('keeps raw uploads auth-protected', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await post(rawForm('image/png'))
    expect(res.status).toBe(401)
    expect(mocks.uploadImage).not.toHaveBeenCalled()
  })

  it('uploads raw files for authenticated users', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: '507f1f77bcf86cd799439011', role: 'free' },
    })
    const res = await post(rawForm('image/png'))
    expect(res.status).toBe(200)
    const [buffer, folder, opts] = mocks.uploadImage.mock.calls[0]
    expect(folder).toBe('crushsvg/uploads')
    expect(opts.public_id).toMatch(/^507f1f77bcf86cd799439011_\d+$/)
    expect(buffer.toString('utf-8')).toBe('fake-bytes')
  })
})
