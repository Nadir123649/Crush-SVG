import { NextRequest, NextResponse } from 'next/server'

import { getRequestId } from '@/lib/shared/logger'

// Standard 401 body for every "authentication required / invalid credentials"
// response. Kept free of Node-only imports so it can be used from proxy.ts
// (edge) as well as route handlers.
//
//   { "success": false, "code": "UNAUTHORIZED", "message": "Authentication required" }

export const UNAUTHORIZED_CODE = 'UNAUTHORIZED'
export const UNAUTHORIZED_MESSAGE = 'Authentication required'

export function unauthorizedResponse(
  message: string = UNAUTHORIZED_MESSAGE,
  request?: NextRequest,
): NextResponse {
  const headers: Record<string, string> = {}
  if (request) headers['x-request-id'] = getRequestId(request)

  return NextResponse.json(
    { success: false, code: UNAUTHORIZED_CODE, message },
    { status: 401, headers },
  )
}
