import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
// Never cache or statically prerender: monitors must hit a live handler.
export const dynamic = 'force-dynamic'

// Public liveness probe for uptime monitoring.
//
// Deliberately has no dependencies (no DB, no cache, no auth) so it keeps
// returning 200 as long as the process can serve requests. Dependency-aware
// readiness (DB ping, 503 when degraded) stays on GET /api/v1/health.
export function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}
