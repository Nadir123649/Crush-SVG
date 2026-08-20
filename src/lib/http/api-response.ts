import { NextRequest, NextResponse } from 'next/server'

import { getRequestId } from '@/lib/shared/logger'

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

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase().split(':')[0]
  return h === 'localhost' || h === '127.0.0.1' || h === '::1'
}

function looksLikeIp(host: string): boolean {
  const h = host.toLowerCase().split(':')[0]
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(h) || /^[0-9a-f:]{2,45}$/.test(h)
}

function originFromHost(request: NextRequest, host: string): string {
  const protocol =
    request.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
  return `${protocol}://${host}`
}

/**
 * Resolves the public origin used for links inside emails (verification,
 * password reset) and redirects. The request's own host is preferred so
 * emails always point at the domain the app is actually served from:
 * `http://localhost:3000` in local dev, `https://crush-svg.vercel.app` (or a
 * custom domain) when deployed — even when NEXT_PUBLIC_APP_URL in the build
 * still points at localhost. Any real public host is accepted (Vercel sets
 * x-forwarded-host itself); local hosts and IP literals fall through to the
 * canonical URL so spoofed host headers can't redirect email links.
 */
export function getOrigin(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''

  if (host && (hostAllowed(host) || trustProxy())) {
    return originFromHost(request, host)
  }

  if (host && !isLocalHost(host) && !looksLikeIp(host)) {
    return originFromHost(request, host)
  }

  const canonical = canonicalBase()
  if (canonical) return canonical

  return `https://${allowedHosts()[0] ?? 'localhost'}`
}

function trustProxy(): boolean {
  return process.env.TRUST_PROXY === 'true'
}