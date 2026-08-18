import { NextRequest, NextResponse } from 'next/server'

import { getRequestId } from '@/lib/logger'

export function successResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
  request?: NextRequest
) {
  const responseHeaders: Record<string, string> = { ...headers }
  if (request) responseHeaders['x-request-id'] = getRequestId(request)
  return NextResponse.json(
    {
      success: true,
      version: '1.0.0',
      payload: data,
      serverTimestamp: new Date().toISOString(),
    },
    { status, headers: responseHeaders }
  )
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>,
  request?: NextRequest
) {
  const responseHeaders: Record<string, string> = { ...headers }
  if (request) responseHeaders['x-request-id'] = getRequestId(request)
  return NextResponse.json(
    {
      success: false,
      version: '1.0.0',
      payload: { error: { code, message } },
      serverTimestamp: new Date().toISOString(),
    },
    { status, headers: responseHeaders }
  )
}

function canonicalBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? ''
}

function allowedHosts(): string[] {
  return (process.env.APP_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? '')
    .split(',')
    .map((s) => s.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase())
    .filter(Boolean)
}

function hostAllowed(host: string): boolean {
  const allowed = allowedHosts()
  if (allowed.length === 0) return true
  const normalized = host.toLowerCase().replace(/:\d+$/, '')
  return allowed.some((a) => a.replace(/:\d+$/, '') === normalized)
}

/**
 * Resolves the public origin used for links inside emails (verification,
 * password reset) and redirects. The request's own host is preferred so
 * emails always point at the domain the app is actually served from:
 * `http://localhost:3000` in local dev, `https://crush-svg.vercel.app` (or a
 * custom domain) when deployed. Behind a trusted proxy (TRUST_PROXY=true, as
 * on Vercel) the forwarded host is authoritative. Falls back to the
 * configured canonical URL only when no trusted host is available.
 */
export function getOrigin(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''

  if (host && (hostAllowed(host) || trustProxy())) {
    const protocol =
      request.headers.get('x-forwarded-proto') ||
      (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
    return `${protocol}://${host}`
  }

  const canonical = canonicalBase()
  if (canonical) return canonical

  return `https://${allowedHosts()[0] ?? 'localhost'}`
}

function trustProxy(): boolean {
  return process.env.TRUST_PROXY === 'true'
}