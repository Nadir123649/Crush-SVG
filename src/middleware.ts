import { NextRequest, NextResponse } from 'next/server'

import { getRequestId } from '@/lib/logger'

export function middleware(request: NextRequest): NextResponse {
  const requestId = getRequestId(request)
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}