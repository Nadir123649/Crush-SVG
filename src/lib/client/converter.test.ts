import { describe, expect, it } from 'vitest'

import { parseSvgDimensions, svgToDataUrl } from '@/lib/client/converter'

describe('parseSvgDimensions', () => {
  it('parses explicit width and height attributes', () => {
    expect(
      parseSvgDimensions('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"></svg>')
    ).toEqual({ width: 120, height: 80 })
  })

  it('parses the viewBox when width/height are absent', () => {
    expect(
      parseSvgDimensions('<svg viewBox="0 0 200 100"><rect/></svg>')
    ).toEqual({ width: 200, height: 100 })
  })

  it('returns undefined values for svg without dimensions', () => {
    expect(parseSvgDimensions('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
  })

  it('handles mixed width-only svgs', () => {
    expect(parseSvgDimensions('<svg width="64"></svg>')).toEqual({
      width: 64,
      height: undefined,
    })
  })
})

describe('svgToDataUrl', () => {
  it('creates a deterministic data url from svg content', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    expect(svgToDataUrl(svg)).toBe(
      'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E'
    )
    expect(svgToDataUrl(svg)).toBe(svgToDataUrl(svg))
  })
})
