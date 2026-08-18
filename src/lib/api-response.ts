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

const CANONICAL_BASE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? ''

const ALLOWED_HOSTS = (process.env.APP_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? '')
  .split(',')
  .map((s) => s.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase())
  .filter(Boolean)

function hostAllowed(host: string): boolean {
  if (ALLOWED_HOSTS.length === 0) return true
  const normalized = host.toLowerCase().replace(/:\d+$/, '')
  return ALLOWED_HOSTS.some((allowed) => allowed.replace(/:\d+$/, '') === normalized)
}

export function getOrigin(request: NextRequest): string {
  if (CANONICAL_BASE) return CANONICAL_BASE

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000'

  if (!hostAllowed(host)) {
    return `https://${ALLOWED_HOSTS[0] ?? 'localhost'}`
  }

  const protocol =
    request.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
  return `${protocol}://${host}`
}