import { describe, expect, it } from 'vitest'

import { svgToDataUrl } from '@/lib/client/converter'

describe('svgToDataUrl', () => {
  it('creates a deterministic data url from svg content', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    expect(svgToDataUrl(svg)).toBe(
      'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E'
    )
    expect(svgToDataUrl(svg)).toBe(svgToDataUrl(svg))
  })
})