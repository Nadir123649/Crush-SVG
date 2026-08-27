import { NextRequest, NextResponse } from 'next/server'
import { getRequestId } from '@/lib/shared/logger'

export function proxy(request: NextRequest): NextResponse {
  const hostname = request.headers.get('host')
  const url = request.nextUrl
  
  let response: NextResponse | undefined;

  // Agar request api.crushsvg.net ya staging-api.crushsvg.net se aa rahi hai
  if (hostname === 'api.crushsvg.net' || hostname === 'staging-api.crushsvg.net') {
    
    // Agar koi directly base URL (api.crushsvg.net/) khole
    if (url.pathname === '/') {
      response = NextResponse.json(
        { status: "online", service: "CrushSVG API Gateway" }, 
        { status: 200 }
      )
    }

    // Agar path /api se shuru nahi hota, toh usay internal /api folder par rewrite kar do
    else if (!url.pathname.startsWith('/api')) {
      response = NextResponse.rewrite(new URL(`/api${url.pathname}`, request.url))
    }
  }

  // Agar koi specific response abhi tak nahi bana
  if (!response) {
    response = NextResponse.next()
  }

  // Pehle ka proxy.ts wala logic: add x-request-id
  const requestId = getRequestId(request)
  response.headers.set('x-request-id', requestId)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
