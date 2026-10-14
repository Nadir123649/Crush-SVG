import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { User, connectToDatabase } from '@/lib/database/db'
import { errorResponse } from '@/lib/http/api-response'
import { createCsvStream } from '@/lib/shared/csv-export'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:users:export', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many export requests. Please try again later.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error

  await connectToDatabase()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')?.trim()
  const role = searchParams.get('role')?.trim()
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

  const verifiedOr = [
    { isVerified: true },
    { providers: { $in: ['google', 'google.com'] } }
  ]

  const filter: Record<string, unknown> = {}
  const andClauses: Record<string, unknown>[] = []

  if (search) {
    andClauses.push({
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { uid: { $regex: search, $options: 'i' } },
      ]
    })
  }

  if (role && role !== 'all') {
    andClauses.push({ role })
  }

  if (status === 'verified') {
    andClauses.push({ $or: verifiedOr })
  } else if (status === 'unverified') {
    andClauses.push({ $nor: verifiedOr })
  }

  if (andClauses.length === 1) {
    Object.assign(filter, andClauses[0])
  } else if (andClauses.length > 1) {
    filter.$and = andClauses
  }

  let cursor: any
  if (sortBy === 'status') {
    cursor = User.aggregate([
      { $match: filter },
      {
        $addFields: {
          computedStatus: {
            $cond: {
              if: {
                $or: [
                  { $eq: ['$isVerified', true] },
                  { $in: ['google.com', { $ifNull: ['$providers', []] }] },
                  { $in: ['google', { $ifNull: ['$providers', []] }] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $sort: { computedStatus: sortOrder, createdAt: -1 } },
    ], { allowDiskUse: true }).cursor({ batchSize: 500 })
  } else {
    const sortObj: Record<string, 1 | -1> = {}
    sortObj[sortBy] = sortOrder
    cursor = User.find(filter).sort(sortObj).lean().cursor({ batchSize: 500 })
  }

  const isGoogleUser = (u: any) =>
    Array.isArray(u.providers) &&
    u.providers.some((p: string) => p === 'google' || p === 'google.com')
  const isVerifiedUser = (u: any) => u.isVerified === true || isGoogleUser(u)

  const headers = [
    'ID',
    'Email',
    'Display Name',
    'Role',
    'Status',
    'Provider',
    'Conversions Used',
    'Created At'
  ]

  async function* generateUserRows() {
    for await (const doc of cursor) {
      const u = doc as any
      const id = u.uid || u.id || u._id?.toString() || ''
      const email = u.email || ''
      const displayName = u.displayName || ''
      const userRole = u.role || 'user'
      const statusText = isVerifiedUser(u) ? 'Verified' : 'Unverified'
      const provider = isGoogleUser(u) ? 'Google' : 'Email'
      const conversionsUsed = u.conversionsUsed != null ? String(u.conversionsUsed) : '0'
      const createdAt = u.createdAt ? new Date(u.createdAt).toISOString() : ''

      yield [id, email, displayName, userRole, statusText, provider, conversionsUsed, createdAt]
    }
  }

  const stream = createCsvStream({
    headers,
    rowGenerator: generateUserRows,
  })

  const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
