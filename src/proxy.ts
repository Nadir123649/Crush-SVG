import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { getRequestId } from '@/lib/shared/logger'
import { verifyRefreshTokenEdge } from '@/lib/auth/edge-tokens'
import { unauthorizedResponse } from '@/lib/http/unauthorized'
import { API_DOCS_PATH } from '@/lib/openapi/constants'

const intlMiddleware = createMiddleware(routing)

// /es/api-docs, /fr/api-docs, ... — the docs page has no locale variants.
const LOCALIZED_API_DOCS_PATTERN = new RegExp(
  `^\\/(${routing.locales.join('|')})${API_DOCS_PATH}$`
)

const API_SUBDOMAINS = ['api.crushsvg.net', 'staging.api.crushsvg.net']

const CORS_ORIGINS = [
  'https://crushsvg.net',
  'https://www.crushsvg.net',
  'https://staging.crushsvg.net',
]

// ── Route classification ──────────────────────────────────────────────
//
// PUBLIC
// No authentication required.
//
// AUTHENTICATED
// Requires a valid Bearer token.
//
// ADMIN
// Requires a valid Bearer token AND admin authorization.
// IMPORTANT: Admin role/permission must also be verified by the API/backend.
//
// Everything under /api/* that is NOT explicitly public is treated as
// authenticated by default. This prevents accidentally exposing a new API
// endpoint when it is added later.

// ── Public Pages ──────────────────────────────────────────────────────

const PUBLIC_PAGES = new Set([
  '/',
  '/convert-svg-to-png',
  '/png-to-svg',
  '/image-resizer',
  '/background-remover',

  // Auth pages
  '/login',
  '/signup',
  '/forgot-password',
  '/verify',
  '/email-verification',

  // Legal / informational
  '/about',
  '/terms',
  '/privacy-policy',
  '/cookies',
  '/contact-us',
  '/help',
  '/support',
  '/changelog',
  '/team',

  // Content / documentation
  '/svg-guides',
  '/api-docs',
])

const PUBLIC_PAGE_PARENTS = [
  '/blog',
  '/reset-password',
  '/use-case',
]

// ── Public APIs ───────────────────────────────────────────────────────

const PUBLIC_API_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/logout-all',

  // Health checks (uptime monitoring)
  '/api/health',
  '/api/v1/health',

  // Public tools
  '/api/v1/convert',
  '/api/v1/vectorize',
  '/api/v1/background-remove',
  '/api/v1/usage',
  '/api/v1/svg/validate',

  // Password / verification flows
  '/api/v1/passwords/',
  '/api/v1/verification/',

  // OAuth
  '/api/v1/oauth',

  // Public content
  '/api/v1/blog',

  // Newsletter
  '/api/v1/newsletter',

  // Contact form
  '/api/v1/contact',

  // API documentation
  '/api/openapi',
]

// ── Authenticated APIs ────────────────────────────────────────────────
//
// These are documented explicitly for clarity, but the API middleware
// defaults all non-public /api/* routes to authenticated anyway.

const AUTH_API_PREFIXES = [
  '/api/v1/profile',
  '/api/v1/conversions',
  '/api/v1/uploads',
  '/api/v1/upload/',
  '/api/me',
]

const AUTH_API_EXACT = new Set([
  '/api/v1/auth/change-password',
])

// ── Admin ─────────────────────────────────────────────────────────────

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/v1/admin/')
}

// ── Helpers ───────────────────────────────────────────────────────────

function isPublicPage(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true

  return PUBLIC_PAGE_PARENTS.some(
    (parent) =>
      pathname === parent || pathname.startsWith(parent + '/')
  )
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(prefix)
  )
}

function isAuthApi(pathname: string): boolean {
  if (
    AUTH_API_PREFIXES.some(
      (prefix) =>
        pathname === prefix || pathname.startsWith(prefix)
    )
  ) {
    return true
  }

  return AUTH_API_EXACT.has(pathname)
}

function hasBearerToken(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')

  if (!auth) return false

  const [scheme, token] = auth.trim().split(/\s+/)

  return (
    scheme?.toLowerCase() === 'bearer' &&
    !!token
  )
}

function isApiSubdomain(
  hostname: string | null
): boolean {
  return (
    !!hostname &&
    API_SUBDOMAINS.includes(hostname)
  )
}

function setCorsHeaders(
  response: NextResponse,
  request: NextRequest
): void {
  const origin = request.headers.get('origin')

  if (
    origin &&
    CORS_ORIGINS.includes(origin)
  ) {
    response.headers.set(
      'Access-Control-Allow-Origin',
      origin
    )

    response.headers.set(
      'Vary',
      'Origin'
    )
  }

  response.headers.set(
    'Access-Control-Allow-Credentials',
    'true'
  )

  // Retry-After is not CORS-safelisted; without this the frontend origin
  // cannot read it from a 429.
  response.headers.set(
    'Access-Control-Expose-Headers',
    'Retry-After'
  )
}

function addRequestId(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  response.headers.set(
    'x-request-id',
    getRequestId(request)
  )

  return response
}

// ── Proxy ─────────────────────────────────────────────────────────────

export async function proxy(
  request: NextRequest
): Promise<NextResponse> {
  const hostname = request.headers.get('host')
  const url = request.nextUrl
  const pathname = url.pathname

  // ───────────────────────────────────────────────────────────────────
  // API SUBDOMAIN
  // ───────────────────────────────────────────────────────────────────

  if (isApiSubdomain(hostname)) {
    // API root
    if (pathname === '/') {
      return NextResponse.json(
        {
          status: 'online',
          service: 'CrushSVG API Gateway',
        },
        { status: 200 }
      )
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      const preflight = new NextResponse(null, {
        status: 204,
      })

      const origin =
        request.headers.get('origin')

      if (
        origin &&
        CORS_ORIGINS.includes(origin)
      ) {
        preflight.headers.set(
          'Access-Control-Allow-Origin',
          origin
        )

        preflight.headers.set(
          'Vary',
          'Origin'
        )
      }

      preflight.headers.set(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS'
      )

      preflight.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization,X-Request-ID'
      )

      preflight.headers.set(
        'Access-Control-Allow-Credentials',
        'true'
      )

      preflight.headers.set(
        'Access-Control-Max-Age',
        '86400'
      )

      return addRequestId(
        preflight,
        request
      )
    }

    // /v1/* → /api/v1/*
    if (pathname.startsWith('/v1/')) {
      const rewrittenUrl = new URL(
        `/api${pathname}`,
        request.url
      )

      const response =
        NextResponse.rewrite(rewrittenUrl)

      setCorsHeaders(
        response,
        request
      )

      return addRequestId(
        response,
        request
      )
    }

    // /api/* stays /api/*
    if (pathname.startsWith('/api/')) {
      const response =
        NextResponse.next()

      setCorsHeaders(
        response,
        request
      )

      return addRequestId(
        response,
        request
      )
    }

    // Frontend pages must never be served from the API host. Links that
    // already landed here are sent to the matching frontend origin,
    // preserving path and query.
    if (
      pathname === '/verify' ||
      pathname === '/email-verification' ||
      pathname.startsWith('/reset-password/')
    ) {
      const frontendHost = hostname!.startsWith('staging.')
        ? 'https://staging.crushsvg.net'
        : 'https://crushsvg.net'
      return addRequestId(
        NextResponse.redirect(new URL(`${pathname}${url.search}`, frontendHost)),
        request
      )
    }

    // Any other API-subdomain path → /api/*
    const rewrittenUrl = new URL(
      `/api${pathname}`,
      request.url
    )

    const response =
      NextResponse.rewrite(rewrittenUrl)

    setCorsHeaders(
      response,
      request
    )

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // /v1/* ON NON-API HOSTS → /api/v1/*
  // ───────────────────────────────────────────────────────────────────
  //
  // A rewrite does not re-run the proxy, so apply the same
  // public/authenticated check as the API routes below.

  if (pathname.startsWith('/v1/')) {
    const apiPath = `/api${pathname}`

    if (
      !isPublicApi(apiPath) &&
      !hasBearerToken(request)
    ) {
      return unauthorizedResponse(
        undefined,
        request
      )
    }

    const rewrittenUrl = url.clone()
    rewrittenUrl.pathname = apiPath

    const response =
      NextResponse.rewrite(rewrittenUrl)

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // API ROUTES
  // ───────────────────────────────────────────────────────────────────

  if (
    pathname.startsWith('/api/') ||
    pathname === '/api'
  ) {
    // 1. Explicitly public APIs
    if (isPublicApi(pathname)) {
      const response =
        NextResponse.next()

      return addRequestId(
        response,
        request
      )
    }

    // 2. ALL non-public APIs require authentication
    const hasToken =
      hasBearerToken(request)

    if (!hasToken) {
      return unauthorizedResponse(
        undefined,
        request
      )
    }

    // 3. Admin API
    //
    // Token presence is checked here.
    // Actual admin role/permission MUST be verified
    // inside the API handler/service.
    if (isAdminApi(pathname)) {
      const response =
        NextResponse.next()

      return addRequestId(
        response,
        request
      )
    }

    // 4. Explicit authenticated APIs
    if (isAuthApi(pathname)) {
      const response =
        NextResponse.next()

      return addRequestId(
        response,
        request
      )
    }

    // 5. Default-deny:
    // Any future /api/* endpoint is authenticated automatically.
    const response =
      NextResponse.next()

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // ADMIN PAGES
  // ───────────────────────────────────────────────────────────────────

  if (isAdminPage(pathname)) {
    const refreshToken =
      request.cookies.get(
        'crushsvg_refresh'
      )?.value

    if (!refreshToken) {
      return NextResponse.redirect(
        new URL('/', request.url)
      )
    }

    const decoded = await verifyRefreshTokenEdge(refreshToken)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.redirect(
        new URL('/', request.url)
      )
    }

    const response =
      NextResponse.next()

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // STATIC / INTERNAL / METADATA
  // ───────────────────────────────────────────────────────────────────

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/monitoring') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    const response =
      NextResponse.next()

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // PUBLIC AUTH ACTION PAGES
  // ───────────────────────────────────────────────────────────────────

  if (
    pathname.startsWith('/reset-password') ||
    pathname === '/email-verification'
  ) {
    const response =
      NextResponse.next()

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // VERIFY PAGE (public — modal-only, no auth needed)
  // ───────────────────────────────────────────────────────────────────

  if (pathname === '/verify') {
    const response =
      NextResponse.next()

    return addRequestId(
      response,
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // API DOCS (public — lives outside [locale])
  // ───────────────────────────────────────────────────────────────────
  //
  // intlMiddleware would rewrite /api-docs to /en/api-docs, which has
  // no route and 404s.

  if (pathname === API_DOCS_PATH) {
    const response =
      NextResponse.next()

    return addRequestId(
      response,
      request
    )
  }

  if (LOCALIZED_API_DOCS_PATTERN.test(pathname)) {
    const docsUrl = url.clone()
    docsUrl.pathname = API_DOCS_PATH

    return addRequestId(
      NextResponse.redirect(docsUrl),
      request
    )
  }

  // ───────────────────────────────────────────────────────────────────
  // PUBLIC / NORMAL PAGES
  // ───────────────────────────────────────────────────────────────────

  const response =
    intlMiddleware(request)

  // Keep request ID
  response.headers.set(
    'x-request-id',
    getRequestId(request)
  )

  // Persist language preference
  if (!response.redirected) {
    const localePattern =
      routing.locales.join('|')

    const localeMatch =
      pathname.match(
        new RegExp(
          `^\\/(${localePattern})(\\/|$)`
        )
      )

    if (localeMatch) {
      const currentCookie =
        request.cookies.get(
          'NEXT_LOCALE'
        )?.value

      if (
        currentCookie !== localeMatch[1]
      ) {
        response.cookies.set(
          'NEXT_LOCALE',
          localeMatch[1],
          {
            path: '/',
            maxAge:
              365 * 24 * 60 * 60,
            sameSite: 'lax',
          }
        )
      }
    }
  }

  return response
}

// ── Matcher ───────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}