import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { AuditLog, connectToDatabase } from '@/lib/database/db'
import { errorResponse } from '@/lib/http/api-response'
import { createCsvStream } from '@/lib/shared/csv-export'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:audits:export', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many export requests. Please try again later.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error

  await connectToDatabase()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()

  const filter: Record<string, unknown> = {}
  if (search) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(search)

    const filterOr: any[] = [
      { action: { $regex: search, $options: 'i' } },
      { adminId: { $regex: search, $options: 'i' } },
      { resourceType: { $regex: search, $options: 'i' } },
      { target: { $regex: search, $options: 'i' } },
      { ipAddress: { $regex: search, $options: 'i' } },
      { 'details.email': { $regex: search, $options: 'i' } },
      { 'details.newRole': { $regex: search, $options: 'i' } },
      { 'details.oldRole': { $regex: search, $options: 'i' } },
      { 'details.role': { $regex: search, $options: 'i' } },
      { 'details.newDisplayName': { $regex: search, $options: 'i' } },
      { 'details.message': { $regex: search, $options: 'i' } },
      { 'details.error': { $regex: search, $options: 'i' } },
    ]

    const isDateSearch = /^\d{4}(-\d{2})?(-\d{2})?$/.test(search)
    if (isDateSearch) {
      const parts = search.split('-').map(Number)
      let start: Date
      let end: Date
      if (parts.length === 1) {
        start = new Date(Date.UTC(parts[0], 0, 1, 0, 0, 0, 0))
        end = new Date(Date.UTC(parts[0], 11, 31, 23, 59, 59, 999))
      } else if (parts.length === 2) {
        start = new Date(Date.UTC(parts[0], parts[1] - 1, 1, 0, 0, 0, 0))
        end = new Date(Date.UTC(parts[0], parts[1], 0, 23, 59, 59, 999))
      } else {
        start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0))
        end = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999))
      }
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filterOr.push({ createdAt: { $gte: start, $lte: end } })
      }
    } else if (/\d/.test(search)) {
      filterOr.push({
        $expr: {
          $regexMatch: { input: { $toString: '$createdAt' }, regex: search, options: 'i' }
        }
      })
    }

    const searchLower = search.toLowerCase()
    if (searchLower === 'error' || searchLower === 'fail') {
      filterOr.push({ action: { $regex: 'fail|error', $options: 'i' } })
    } else if (searchLower === 'warning' || searchLower === 'warn') {
      filterOr.push({ action: { $regex: 'warn|limit|suspend|delete', $options: 'i' } })
    } else if (searchLower === 'info') {
      filterOr.push({ action: { $not: { $regex: 'fail|error|warn|limit|suspend|delete', $options: 'i' } } })
    }

    if (isObjectId) {
      filterOr.push({ resourceId: search }, { target: search })
    }

    filter.$or = filterOr
  }

  const cursor = AuditLog.find(filter).sort({ createdAt: -1 }).lean().cursor({ batchSize: 500 })

  const getSeverityLevel = (action: string) => {
    const act = (action || '').toLowerCase()
    if (act.includes('fail') || act.includes('error')) return 'error'
    if (act.includes('warn') || act.includes('limit') || act.includes('suspend') || act.includes('delete')) return 'warning'
    return 'info'
  }

  const headers = [
    'Timestamp (UTC)',
    'Level',
    'Event Type',
    'Action Description',
    'User',
    'IP Address'
  ]

  async function* generateAuditRows() {
    for await (const doc of cursor) {
      const audit = doc as any
      const level = getSeverityLevel(audit.action)
      const formattedLevel = level.charAt(0).toUpperCase() + level.slice(1)
      const eventType = `${audit.action || ''} ${audit.resourceType || ''}`.trim()
      const actionDesc =
        audit.details && Object.keys(audit.details).length > 0
          ? JSON.stringify(audit.details)
          : `${audit.action || ''} performed on ${audit.resourceType || 'system'} (${audit.target || audit.resourceId || 'N/A'})`

      yield [
        audit.createdAt ? new Date(audit.createdAt).toISOString() : '',
        formattedLevel,
        eventType,
        actionDesc,
        audit.adminId || 'N/A',
        audit.ipAddress || 'N/A'
      ]
    }
  }

  const stream = createCsvStream({
    headers,
    rowGenerator: generateAuditRows,
  })

  const filename = `audits-export-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
