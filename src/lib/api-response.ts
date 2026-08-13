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

export function getOrigin(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000'
  const protocol =
    request.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
  return `${protocol}://${host}`
}