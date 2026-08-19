import { describe, expect, it } from 'vitest'

import { isValidSvgContent, svgToDataUrl } from '@/lib/client/converter'

describe('svgToDataUrl', () => {
  it('creates a deterministic data url from svg content', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    expect(svgToDataUrl(svg)).toBe(
      'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E'
    )
    expect(svgToDataUrl(svg)).toBe(svgToDataUrl(svg))
  })
})

describe('isValidSvgContent', () => {
  const WITH_DECLARATION = `<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" fill="#000000"/>
</svg>`

  it('accepts a plain svg element', () => {
    expect(isValidSvgContent('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')).toBe(true)
  })

  it('accepts an svg preceded by an XML declaration and comments', () => {
    expect(isValidSvgContent(WITH_DECLARATION)).toBe(true)
  })

  it('accepts an svg preceded by comments only', () => {
    expect(
      isValidSvgContent(`<!-- icon pack --><!-- generator note -->
<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>`)
    ).toBe(true)
  })

  it('rejects empty and non-svg content', () => {
    expect(isValidSvgContent('')).toBe(false)
    expect(isValidSvgContent('   ')).toBe(false)
    expect(isValidSvgContent('just some text')).toBe(false)
  })

  it('rejects an svg without a closing tag or trailing content', () => {
    expect(isValidSvgContent('<svg width="10"></svg> trailing')).toBe(false)
    expect(isValidSvgContent('<svg width="10">')).toBe(false)
  })
})