import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/db'
import { auth } from '@/lib/middleware/auth-middleware'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; latencyMs?: number }> = {}

  const dbStart = Date.now()
  try {
    const connection = await connectToDatabase()
    await connection.getClient().db().command({ ping: 1 })
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error) {
    checks.database = { status: 'error', message: (error as Error).message, latencyMs: Date.now() - dbStart }
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok')

  // Check if caller is authenticated staff/admin
  let isAdmin = false
  try {
    const who = await auth(request)
    if ('user' in who && who.user.role === 'admin') {
      isAdmin = true
    }
  } catch {
    isAdmin = false
  }

  // If authenticated as admin, provide full infrastructure diagnostic telemetry
  if (isAdmin) {
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      checks,
    }, { status: allHealthy ? 200 : 503 })
  }

  // Public unauthenticated consumers receive a sanitized, minimal response
  // without leaking internal versions, database performance, or infrastructure latencies
  return NextResponse.json(
    { status: allHealthy ? 'ok' : 'degraded' },
    { status: allHealthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
