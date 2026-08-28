import { NextRequest, NextResponse } from 'next/server'
import { getRequestId } from '@/lib/shared/logger'

const API_SUBDOMAINS = ['api.crushsvg.net', 'staging.api.crushsvg.net']
const CORS_ORIGINS = ['https://crushsvg.net', 'https://staging.crushsvg.net']

function isApiSubdomain(hostname: string | null): boolean {
  return !!hostname && API_SUBDOMAINS.includes(hostname)
}

function setCorsHeaders(response: NextResponse, request: NextRequest): void {
  const origin = request.headers.get('origin')
  if (origin && CORS_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true')
}

export function proxy(request: NextRequest): NextResponse {
  const hostname = request.headers.get('host')
  const url = request.nextUrl

  // ── API subdomain handling ──────────────────────────────────────────
  if (isApiSubdomain(hostname)) {
    // Health check at root
    if (url.pathname === '/') {
      return NextResponse.json(
        { status: 'online', service: 'CrushSVG API Gateway' },
        { status: 200 }
      )
    }

    // OPTIONS preflight — return immediately with CORS headers
    if (request.method === 'OPTIONS') {
      const preflight = new NextResponse(null, { status: 204 })
      const origin = request.headers.get('origin')
      if (origin && CORS_ORIGINS.includes(origin)) {
        preflight.headers.set('Access-Control-Allow-Origin', origin)
      }
      preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID')
      preflight.headers.set('Access-Control-Allow-Credentials', 'true')
      preflight.headers.set('Access-Control-Max-Age', '86400')
      return preflight
    }

    // Rewrite /v1/* → /api/v1/* (keeps existing route handlers untouched)
    if (url.pathname.startsWith('/v1/')) {
      const rewrittenUrl = new URL(`/api${url.pathname}`, request.url)
      const response = NextResponse.rewrite(rewrittenUrl)
      setCorsHeaders(response, request)
      const requestId = getRequestId(request)
      response.headers.set('x-request-id', requestId)
      return response
    }

    // /api/v1/* on the API subdomain — pass through with CORS
    if (url.pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      setCorsHeaders(response, request)
      const requestId = getRequestId(request)
      response.headers.set('x-request-id', requestId)
      return response
    }

    // Any other path on the API subdomain — rewrite to /api + path
    const rewrittenUrl = new URL(`/api${url.pathname}`, request.url)
    const response = NextResponse.rewrite(rewrittenUrl)
    setCorsHeaders(response, request)
    const requestId = getRequestId(request)
    response.headers.set('x-request-id', requestId)
    return response
  }

  // ── Normal requests (www, preview, localhost) ───────────────────────
  const requestId = getRequestId(request)
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
