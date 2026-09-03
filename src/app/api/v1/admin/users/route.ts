import { NextRequest } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { User, AuditLog, isDuplicateKeyError } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { toUserDTO } from '@/lib/auth/auth'
import { hashPassword } from '@/lib/auth/passwords'
import { getClientIp } from '@/lib/security/ip'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:users:list', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')?.trim()
  const role = searchParams.get('role')?.trim()
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

  // Verified = email verified OR Google/OAuth provider.
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
    // Not verified AND not a Google/OAuth account
    andClauses.push({ $nor: verifiedOr })
  }

  if (andClauses.length === 1) {
    Object.assign(filter, andClauses[0])
  } else if (andClauses.length > 1) {
    filter.$and = andClauses
  }

  let docs
  
  if (sortBy === 'status') {
    docs = await User.aggregate([
      { $match: filter },
      { 
        $addFields: {
          computedStatus: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$isVerified", true] },
                  { $in: ["google.com", { $ifNull: ["$providers", []] }] },
                  { $in: ["google", { $ifNull: ["$providers", []] }] }
                ]
              },
              then: 1, // Active
              else: 0  // Unverified
            }
          }
        }
      },
      { $sort: { computedStatus: sortOrder, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ])
  } else {
    // Default sorting
    const sortObj: Record<string, 1 | -1> = {}
    sortObj[sortBy] = sortOrder
    docs = await User.find(filter).sort(sortObj).skip(skip).limit(limit)
  }

  const [total] = await Promise.all([
    User.countDocuments(filter)
  ])

  return successResponse({
    data: docs.map(toUserDTO),
    meta: {
      total,
      page,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:users:create', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
  }

  const { email, displayName, role = 'user', password } = body as {
    email: string
    displayName?: string
    role?: 'user' | 'admin'
    password?: string
  }

  if (!email || !email.includes('@')) {
    return errorResponse(400, 'invalid_email', 'A valid email address is required', undefined, request)
  }

  if (displayName && typeof displayName !== 'string') {
    return errorResponse(400, 'invalid_name', 'Display name must be a string', undefined, request)
  }

  if (!password || password.length < 8) {
    return errorResponse(400, 'weak_password', 'Password must be at least 8 characters', undefined, request)
  }

  if (role !== 'user' && role !== 'admin') {
    return errorResponse(400, 'invalid_role', 'Role must be either "user" or "admin"', undefined, request)
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return errorResponse(409, 'email_taken', 'A user with this email already exists', undefined, request)
  }

  let created
  try {
    created = await User.create({
      uid: `admin_${email}`,
      email: email.toLowerCase().trim(),
      displayName: (displayName && displayName.trim()) ? displayName.trim() : email.split('@')[0],
      photoURL: null,
      role,
      isVerified: true,
      password: password ? await hashPassword(password) : undefined,
      providers: ['admin'],
      conversionsUsed: 0,
      lastLoginAt: new Date(),
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorResponse(409, 'email_taken', 'A user with this email already exists', undefined, request)
    }
    throw error
  }

  await AuditLog.create({
    adminId: adminCheck.user.id,
    action: 'user_created',
    target: created._id.toString(),
    resourceType: 'user',
    resourceId: created.uid,
    details: { email: created.email, role: created.role },
    ipAddress: getClientIp(request),
    metadata: { email: created.email, role: created.role },
  })

  return successResponse({ user: toUserDTO(created) }, 201, rateLimitHeaders(rl), request)
}
