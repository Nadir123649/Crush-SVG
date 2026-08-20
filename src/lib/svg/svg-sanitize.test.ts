import { describe, expect, it } from 'vitest'

import { inlineUseImages, sanitizeSvg } from '@/lib/svg/svg-sanitize'

const NS = 'xmlns="http://www.w3.org/2000/svg"'

describe('sanitizeSvg', () => {
  it('injects the namespace on the svg tag only', () => {
    const out = sanitizeSvg('<svg width="10" height="10"></svg>')
    expect(out.startsWith('<svg ')).toBe(true)
    expect(out).toContain(NS)
  })

  it('does not touch comments or CDATA', () => {
    const out = sanitizeSvg('<!-- <svg width="1"> --><svg xmlns="http://www.w3.org/2000/svg"></svg>')
    expect(out).toContain('<!-- <svg width="1"> -->')
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('removes script blocks including inline content', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script type="text/javascript">alert("x")</script><rect width="1" height="1"/></svg>'
    )
    expect(out).not.toContain('script')
    expect(out).toContain('<rect')
  })

  it('removes foreignObject, iframe, embed and object elements', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div onclick="x()">hi</div></foreignObject><iframe src="https://evil.example"/><rect width="1" height="1"/></svg>'
    )
    expect(out).not.toContain('foreignObject')
    expect(out).not.toContain('iframe')
    expect(out).toContain('<rect')
  })

  it('strips quoted and unquoted event handlers', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)" onload=alert(2) onmouseover=\'alert(3)\'><rect width="1" height="1"/></svg>'
    )
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('onload')
    expect(out).not.toContain('onmouseover')
  })

  it('strips script: schemes from all attribute values', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"/><a xlink:href="vbscript:msgbox(1)"/><rect fill="expression(alert(1))" width="1" height="1"/></svg>'
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('vbscript:')
    expect(out).not.toContain('expression(')
  })

  it('strips non-image data: URIs but keeps base64 images', () => {
    const img =
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="/></svg>'
    expect(sanitizeSvg(img)).toContain('data:image/png;base64,')

    const evil =
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:text/html;base64,PHN2Zz4="/></svg>'
    expect(sanitizeSvg(evil)).not.toContain('data:')
  })

  it('does not corrupt text nodes containing data: or expressions', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><text>send data: now</text></svg>'
    )
    expect(out).toContain('send data: now')
  })

  it('adds the xlink namespace for older exports', () => {
    const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    expect(out).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"')
  })

  it('does not double the namespace when present', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10"></svg>'
    )
    expect(out.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g)).toHaveLength(1)
  })
})

describe('inlineUseImages', () => {
  const IMG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

  const pattern =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><rect width="50" height="50" fill="url(#p)"/><defs><pattern id="p" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#img" transform="scale(0.02)"/></pattern><image id="img" width="50" height="50" xlink:href="' +
    IMG +
    '"/></defs></svg>'

  it('inlines a referenced image in place of <use xlink:href>', () => {
    const out = inlineUseImages(pattern)
    expect(out).not.toContain('<use ')
    expect(out).toContain('<image transform="scale(0.02)" width="50" height="50"')
    expect(out).toContain('id="img"') // id stays on the original defs image
  })

  it('inlines a referenced image for modern <use href>', () => {
    const modern = pattern.replace('<use xlink:href="#img"', '<use href="#img"')
    const out = inlineUseImages(modern)
    expect(out).not.toContain('<use ')
    expect(out).toContain('<image transform="scale(0.02)"')
  })

  it('leaves unresolved use references untouched', () => {
    const out = inlineUseImages(
      '<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#missing"/></svg>'
    )
    expect(out).toContain('<use xlink:href="#missing"')
  })

  it('preserves the rendering pipeline end to end (image visible)', async () => {
    const sharp = (await import('sharp')).default
    const rendered = await sharp(Buffer.from(sanitizeSvg(pattern))).toBuffer({
      resolveWithObject: true,
    })
    const { data, info } = await sharp(rendered.data)
      .raw()
      .toBuffer({ resolveWithObject: true })
    const channels = info.channels
    const center =
      (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * channels
    expect(data[center + 3]).toBeGreaterThan(0)
  })
})