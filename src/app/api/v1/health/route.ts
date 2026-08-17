import { NextRequest, NextResponse } from 'next/server'

import { connectToDatabase } from '@/lib/db'
import { successResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET() {
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

  const response = {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    environment: process.env.NODE_ENV ?? 'development',
    checks,
  }

  return NextResponse.json(response, { status: allHealthy ? 200 : 503 })
}