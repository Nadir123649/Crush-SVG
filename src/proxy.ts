import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { getRequestId } from '@/lib/shared/logger'

const intlMiddleware = createMiddleware(routing)

const API_SUBDOMAINS = ['api.crushsvg.net', 'staging.api.crushsvg.net']
const CORS_ORIGINS = ['https://crushsvg.net', 'https://www.crushsvg.net', 'https://staging.crushsvg.net']

// ── Route classification ──────────────────────────────────────────────

const PUBLIC_PAGES = new Set([
  '/',
  '/convert-svg-to-png',
  '/png-to-svg',
  '/image-resizer',
  '/background-remover',
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
  '/api-docs',
])

const PUBLIC_API_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/health',
  '/api/v1/convert',
  '/api/v1/vectorize',
  '/api/v1/background-remove',
  '/api/v1/usage',
  '/api/v1/svg/validate',
  '/api/v1/passwords/',
  '/api/v1/verification/',
  '/api/v1/oauth',
  '/api/v1/blog',
  '/api/openapi',
]

const AUTH_API_PREFIXES = [
  '/api/v1/profile',
  '/api/v1/conversions',
  '/api/v1/uploads',
  '/api/v1/upload/',
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
  // Public parent routes: /blog, /blog/[slug], /use-case/[slug], /reset-password/[token]
  const publicParents = ['/blog', '/reset-password', '/use-case']
  return publicParents.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
}

function isAuthApi(pathname: string): boolean {
  if (AUTH_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return true
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

  // 1. API routes — strictly unaffected by locale routing
  if (pathname.startsWith('/api/') || pathname === '/api') {
    if (isPublicApi(pathname)) {
      const response = NextResponse.next()
      response.headers.set('x-request-id', getRequestId(request))
      return response
    }

    const hasToken = hasBearerToken(request)

    if (isAdminApi(pathname)) {
      if (!hasToken) {
        return jsonError(401, 'unauthorized', 'Authentication required')
      }
      const response = NextResponse.next()
      response.headers.set('x-request-id', getRequestId(request))
      return response
    }

    if (isAuthApi(pathname)) {
      if (!hasToken) {
        return jsonError(401, 'unauthorized', 'Authentication required')
      }
      const response = NextResponse.next()
      response.headers.set('x-request-id', getRequestId(request))
      return response
    }

    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // 2. Admin pages — require auth cookie or redirect to /login
  if (isAdminPage(pathname)) {
    const refreshToken = request.cookies.get('crushsvg_refresh')?.value
    if (!refreshToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // 3. Static assets, metadata endpoints, and internal files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/monitoring') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next()
    response.headers.set('x-request-id', getRequestId(request))
    return response
  }

  // 4. Public pages & tools — delegate to next-intl middleware for localized routing
  const response = intlMiddleware(request)
  response.headers.set('x-request-id', getRequestId(request))

  // Persist language preference in NEXT_LOCALE cookie (handles client-side
  // language switches where next-intl's syncCookie may not fire).
  // Skip redirect responses — the middleware already sets the cookie there.
  if (!response.redirected) {
    const localePattern = routing.locales.join('|')
    const localeMatch = pathname.match(new RegExp(`^\\/(${localePattern})(\\/|$)`))
    if (localeMatch) {
      const currentCookie = request.cookies.get('NEXT_LOCALE')?.value
      if (currentCookie !== localeMatch[1]) {
        response.cookies.set('NEXT_LOCALE', localeMatch[1], {
          path: '/',
          maxAge: 365 * 24 * 60 * 60,
          sameSite: 'lax',
        })
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
