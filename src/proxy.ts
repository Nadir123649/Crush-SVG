import { NextRequest, NextResponse } from 'next/server'
import { getRequestId } from '@/lib/shared/logger'

const API_SUBDOMAINS = ['api.crushsvg.net', 'staging.api.crushsvg.net']
const CORS_ORIGINS = ['https://crushsvg.net', 'https://www.crushsvg.net', 'https://staging.crushsvg.net']

// ── Route classification ──────────────────────────────────────────────

const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify',
  '/email-verification',
  '/about',
  '/terms',
  '/privacy-policy',
  '/cookies',
  '/contact-us',
  '/help',
  '/support',
  '/changelog',
  '/team',
  '/svg-guides',
  '/png-to-svg',
  '/api-docs',
])

const PUBLIC_API_PREFIXES = [
  '/api/v1/auth/',
  '/api/v1/health',
  '/api/v1/convert',
  '/api/v1/vectorize',
  '/api/v1/svg/validate',
  '/api/v1/passwords/',
  '/api/v1/verification/',
  '/api/openapi',
]

const AUTH_API_PREFIXES = [
  '/api/v1/profile',
  '/api/v1/conversions',
  '/api/v1/usage',
  '/api/v1/uploads',
  '/api/me',
]

const AUTH_API_EXACT = new Set([
  '/api/v1/auth/logout',
  '/api/v1/auth/logout-all',
  '/api/v1/auth/change-password',
])

// ── Helpers ───────────────────────────────────────────────────────────

function isPublicPage(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true
  // Public parent routes: /blog, /blog/[slug] — all children are public
  const publicParents = ['/blog', '/reset-password']
  return publicParents.some((p) => pathname.startsWith(p + '/'))
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
}

function isAuthApi(pathname: string): boolean {
  if (AUTH_API_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return AUTH_API_EXACT.has(pathname)
}

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/v1/admin/')
}

function hasBearerToken(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  if (!auth) return false
  const [scheme, token] = auth.split(' ')
  return scheme?.toLowerCase() === 'bearer' && !!token
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      version: '1.0.0',
      payload: { error: { code, message } },
      serverTimestamp: new Date().toISOString(),
    },
    { status }
  )
}

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

// ── Proxy (replaces middleware.ts in Next.js 16) ──────────────────────

export function proxy(request: NextRequest): NextResponse {
  const hostname = request.headers.get('host')
  const url = request.nextUrl
  const pathname = url.pathname

  // ── API subdomain handling ──────────────────────────────────────────
  if (isApiSubdomain(hostname)) {
    if (pathname === '/') {
      return NextResponse.json(
        { status: 'online', service: 'CrushSVG API Gateway' },
        { status: 200 }
      )
    }

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

    if (pathname.startsWith('/v1/')) {
      const rewrittenUrl = new URL(`/api${pathname}`, request.url)
      const response = NextResponse.rewrite(rewrittenUrl)
      setCorsHeaders(response, request)
      response.headers.set('x-request-id', getRequestId(request))
      return response
    }

    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      setCorsHeaders(response, request)
      response.headers.set('x-request-id', getRequestId(request))
      return response
    }

    const rewrittenUrl = new URL(`/api${pathname}`, request.url)
    const response = NextResponse.rewrite(rewrittenUrl)
    setCorsHeaders(response, request)
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // ── Route protection ────────────────────────────────────────────────

  // Public pages — pass through
  if (isPublicPage(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // Public API routes — pass through
  if (isPublicApi(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  const hasToken = hasBearerToken(request)

  // Admin pages — pass through (full auth + role check done client-side by admin/layout.tsx)
  if (isAdminPage(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // Admin API — require token (full JWT + role verification done in route handlers)
  if (isAdminApi(pathname)) {
    if (!hasToken) {
      return jsonError(401, 'unauthorized', 'Authentication required')
    }
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // Auth-required API routes — require token
  if (isAuthApi(pathname)) {
    if (!hasToken) {
      return jsonError(401, 'unauthorized', 'Authentication required')
    }
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // Everything else — pass through
  const response = NextResponse.next()
  response.headers.set('x-request-id', getRequestId(request))
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
