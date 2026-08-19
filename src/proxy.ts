import { NextRequest, NextResponse } from 'next/server'

import { getRequestId } from '@/lib/logger'

const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE, OPTIONS'
const ALLOWED_HEADERS = 'Authorization, Content-Type, Accept, x-request-id'
const EXPOSED_HEADERS = 'x-request-id, X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Conversions-Used, X-Conversions-Remaining'

export function proxy(request: NextRequest): NextResponse {
  const requestId = getRequestId(request)

  // CORS preflight (OPTIONS) requests never reach route handlers in Next —
  // answer them here so browser apps on other domains can call the public API.
  if (request.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 })
    preflight.headers.set('Access-Control-Allow-Origin', '*')
    preflight.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
    preflight.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS)
    preflight.headers.set('Access-Control-Max-Age', '86400')
    return preflight
  }

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS)
  response.headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS)
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}