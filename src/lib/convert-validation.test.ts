import { describe, expect, it } from 'vitest'

import { convertSchema } from '@/lib/convert-validation'

describe('convertSchema', () => {
  it('accepts width and height together', () => {
    const parsed = convertSchema.safeParse({ svg: '<svg></svg>', width: 400, height: 300 })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.width).toBe(400)
      expect(parsed.data.height).toBe(300)
    }
  })

  it('rejects heights outside 1-4000', () => {
    const tooBig = convertSchema.safeParse({ svg: '<svg></svg>', width: 400, height: 5000 })
    expect(tooBig.success).toBe(false)

    const tooSmall = convertSchema.safeParse({ svg: '<svg></svg>', width: 400, height: 0 })
    expect(tooSmall.success).toBe(false)
  })

  it('rejects non-integer heights', () => {
    const parsed = convertSchema.safeParse({ svg: '<svg></svg>', width: 400, height: 300.5 })
    expect(parsed.success).toBe(false)
  })
})