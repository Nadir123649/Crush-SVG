import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { ConversionLog, connectToDatabase } from '@/lib/database/db'
import { errorResponse } from '@/lib/http/api-response'
import { createCsvStream } from '@/lib/shared/csv-export'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:conversions:export', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many export requests. Please try again later.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error

  await connectToDatabase()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const filter: Record<string, any> = {}

  if (status === 'success') filter.success = true
  else if (status === 'failed') filter.success = false

  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }

  const cursor = ConversionLog.find(filter)
    .sort({ createdAt: -1 })
    .populate('userId', 'uid email displayName photoURL')
    .lean()
    .cursor({ batchSize: 500 })

  const headers = [
    'File ID',
    'User',
    'Email',
    'Input Format',
    'Output Format',
    'File Size (KB)',
    'Status',
    'Timestamp'
  ]

  async function* generateConversionRows() {
    for await (const doc of cursor) {
      const conv = doc as any
      const fileId = conv._id?.toString() || ''
      const userDisplay =
        typeof conv.userId === 'object' && conv.userId !== null
          ? conv.userId.displayName || 'Guest User'
          : conv.userId || 'Guest User'
      const userEmail =
        typeof conv.userId === 'object' && conv.userId !== null
          ? conv.userId.email || conv.guestId || 'Anonymous'
          : conv.guestId || 'Anonymous'
      const inputFormat = conv.inputFormat || ''
      const outputFormat = conv.outputFormat || ''
      const fileSizeKb = conv.originalSize != null ? (conv.originalSize / 1024).toFixed(1) : 'N/A'
      const statusText = conv.success ? 'Success' : 'Failed'
      const timestamp = conv.createdAt ? new Date(conv.createdAt).toISOString() : ''

      yield [
        fileId,
        userDisplay,
        userEmail,
        inputFormat,
        outputFormat,
        fileSizeKb,
        statusText,
        timestamp
      ]
    }
  }

  const stream = createCsvStream({
    headers,
    rowGenerator: generateConversionRows,
  })

  const filename = `conversions-export-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
