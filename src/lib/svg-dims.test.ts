import { describe, expect, it } from 'vitest'

import { computeTargetSize, MAX_OUTPUT_SIZE, OutputTooLargeError, parseSvgDimensions } from '@/lib/svg-dims'

describe('parseSvgDimensions', () => {
  it('parses explicit width and height attributes', () => {
    expect(
      parseSvgDimensions('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"></svg>')
    ).toEqual({ width: 120, height: 80 })
  })

  it('accepts px-suffixed lengths', () => {
    expect(parseSvgDimensions('<svg width="120px" height="80px"></svg>')).toEqual({
      width: 120,
      height: 80,
    })
  })

  it('parses the viewBox when width/height are absent', () => {
    expect(parseSvgDimensions('<svg viewBox="0 0 200 100"><rect/></svg>')).toEqual({
      width: 200,
      height: 100,
    })
  })

  it('parses comma-separated viewBox values', () => {
    expect(parseSvgDimensions('<svg viewBox="0,0,200,100"></svg>')).toEqual({
      width: 200,
      height: 100,
    })
  })

  it('ignores percentage widths and falls back to viewBox', () => {
    expect(parseSvgDimensions('<svg width="100%" height="50%" viewBox="0 0 200 100"></svg>')).toEqual(
      { width: 200, height: 100 }
    )
  })

  it('ignores em/rem/cm units entirely', () => {
    expect(parseSvgDimensions('<svg width="10em" height="5rem"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
    expect(parseSvgDimensions('<svg width="2cm"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
  })

  it('uses viewBox for both axes when only one attribute is present', () => {
    expect(parseSvgDimensions('<svg width="64" viewBox="0 0 32 32"></svg>')).toEqual({
      width: 32,
      height: 32,
    })
  })

  it('returns undefined values for svg without dimensions', () => {
    expect(parseSvgDimensions('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
  })

  it('ignores invalid numbers and zero', () => {
    expect(parseSvgDimensions('<svg width="0" height="abc"></svg>')).toEqual({
      width: undefined,
      height: undefined,
    })
  })

  it('is consistent with the server parser for fixture SVGs', () => {
    expect(parseSvgDimensions('<svg  viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">')).toEqual({
      width: 21,
      height: 21,
    })
    expect(
      parseSvgDimensions('<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">')
    ).toEqual({ width: 48, height: 48 })
  })
})

describe('computeTargetSize', () => {
  const SQUARE = { width: 100, height: 100 }

  it('scales the intrinsic size when no dimensions are requested', () => {
    expect(computeTargetSize(SQUARE, {})).toEqual({ width: 200, height: 200, fit: 'inside' })
    expect(computeTargetSize(SQUARE, { scale: 4 })).toEqual({
      width: 400,
      height: 400,
      fit: 'inside',
    })
  })

  it('uses the requested width and derives the height from the aspect', () => {
    expect(computeTargetSize({ width: 200, height: 100 }, { width: 400 })).toEqual({
      width: 400,
      height: 200,
      fit: 'inside',
    })
  })

  it('produces a contain fit when both dimensions are requested', () => {
    expect(computeTargetSize(SQUARE, { width: 400, height: 300 })).toEqual({
      width: 400,
      height: 300,
      fit: 'contain',
    })
  })

  it('rounds fractional targets', () => {
    const size = computeTargetSize({ width: 200, height: 100 }, { width: 333 })
    expect(size).toEqual({ width: 333, height: 167, fit: 'inside' })
  })

  it('rejects width above the cap', () => {
    expect(() => computeTargetSize(SQUARE, { width: MAX_OUTPUT_SIZE + 1 })).toThrow(
      OutputTooLargeError
    )
  })

  it('rejects aspect-derived height above the cap', () => {
    expect(() => computeTargetSize({ width: 1, height: 1000 }, { width: MAX_OUTPUT_SIZE })).toThrow(
      OutputTooLargeError
    )
  })

  it('rejects scale-derived sizes above the cap', () => {
    expect(() => computeTargetSize(SQUARE, { scale: 50 })).toThrow(OutputTooLargeError)
  })

  it('allows exactly the cap', () => {
    expect(computeTargetSize(SQUARE, { width: MAX_OUTPUT_SIZE, height: MAX_OUTPUT_SIZE })).toEqual({
      width: MAX_OUTPUT_SIZE,
      height: MAX_OUTPUT_SIZE,
      fit: 'contain',
    })
  })

  it('allows the cap as a scale multiple', () => {
    expect(computeTargetSize({ width: 2000, height: 2000 }, { scale: 2 })).toEqual({
      width: 4000,
      height: 4000,
      fit: 'inside',
    })
  })
})