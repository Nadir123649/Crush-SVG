import 'server-only'

import { NextRequest } from 'next/server'

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/
const IPV6_RE = /^[0-9a-fA-F:]{2,45}$/

function looksLikeIp(value: string): boolean {
  const v = value.trim()
  if (IPV4_RE.test(v)) {
    return v.split('.').every((octet) => Number(octet) <= 255)
  }
  return IPV6_RE.test(v)
}

function trustProxy(): boolean {
  return process.env.TRUST_PROXY === 'true'
}

export function getClientIp(request: NextRequest): string | null {
  const reqIp = (request as unknown as { ip?: string }).ip
  if (reqIp && looksLikeIp(reqIp)) return reqIp

  const cf = request.headers.get('cf-connecting-ip')
  if (cf && looksLikeIp(cf)) return cf

  const realIp = request.headers.get('x-real-ip')
  if (realIp && looksLikeIp(realIp)) return realIp

  if (trustProxy()) {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      for (const hop of forwarded.split(',')) {
        if (looksLikeIp(hop)) return hop.trim()
      }
    }
  }

  return null
}
