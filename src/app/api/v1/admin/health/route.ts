import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/db'
import { auth } from '@/lib/middleware/auth-middleware'
import { errorResponse } from '@/lib/http/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error
  if (who.user.role !== 'admin') {
    return errorResponse(403, 'forbidden', 'Admin access required.', undefined, request)
  }

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

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    checks,
  }, { status: allHealthy ? 200 : 503 })
}
