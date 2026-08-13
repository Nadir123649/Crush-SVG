import 'server-only'

import { NextRequest } from 'next/server'

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return request.headers.get('cf-connecting-ip')
}