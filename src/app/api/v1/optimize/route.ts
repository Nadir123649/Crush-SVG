import { NextRequest, NextResponse } from 'next/server'

import { optimizeSvg } from '@/lib/svg/svg-optimizer'
export const runtime = 'nodejs'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400, headers: JSON_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest('Request body must be valid JSON.')
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return badRequest('Request body must be a JSON object.')
    }

    const { svg } = body as { svg?: unknown }

    if (typeof svg !== 'string') {
      return badRequest('Field "svg" is required and must be a string.')
    }

    if (svg.trim().length === 0) {
      return badRequest('Field "svg" must not be empty.')
    }

    if (!/<svg[\s>]/i.test(svg)) {
      return badRequest('Field "svg" must contain an <svg> element.')
    }

    let optimizedSvg: string
    try {
      optimizedSvg = optimizeSvg(svg).optimizedSvg
    } catch (err) {
      console.error('[v1/optimize] optimizer failed:', err)
      return NextResponse.json(
        { success: false, error: 'Failed to optimize SVG.' },
        { status: 500, headers: JSON_HEADERS }
      )
    }

    return NextResponse.json(
      { success: true, optimized_svg: optimizedSvg },
      { status: 200, headers: JSON_HEADERS }
    )
  } catch (err) {
    console.error('[v1/optimize] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500, headers: JSON_HEADERS }
    )
  }
}
