import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { getUsersCollection } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { toUserDTO } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

async function requireAdmin(who: { user: { id: string; role: string } } | { error: Response }): Promise<{ user: { id: string; role: string } } | { error: Response }> {
  if ('error' in who) return who
  if (who.user.role !== 'admin') {
    return { error: NextResponse.json({ error: { code: 'forbidden', message: 'Admin access required' } }, { status: 403 }) }
  }
  return who
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit('admin:users:list', 20, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  const adminCheck = await requireAdmin(who)
  if ('error' in adminCheck) return adminCheck.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit
  const search = searchParams.get('search')?.trim()

  const users = await getUsersCollection()

  const filter: Record<string, unknown> = {}
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { uid: { $regex: search, $options: 'i' } },
    ]
  }

  const [total, docs] = await Promise.all([
    users.countDocuments(filter),
    users.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
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
  const rl = checkRateLimit('admin:users:create', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Try again later.')
  }

  const who = await auth(request)
  const adminCheck = await requireAdmin(who)
  if ('error' in adminCheck) return adminCheck.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'validation_error', 'Invalid JSON body')
  }

  const { email, displayName, role = 'user' } = body as { email: string; displayName?: string; role?: string }

  if (!email || !email.includes('@')) {
    return errorResponse(400, 'validation_error', 'Valid email is required')
  }

  const users = await getUsersCollection()
  const existing = await users.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return errorResponse(409, 'email_taken', 'Email already registered')
  }

  const now = new Date()
  const doc = await users.insertOne({
    _id: new ObjectId(),
    uid: `admin_${email}`,
    email: email.toLowerCase().trim(),
    displayName: displayName ?? email.split('@')[0],
    photoURL: null,
    providers: ['admin'],
    conversionsUsed: 0,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  })

  const created = await users.findOne({ _id: doc.insertedId })
  return successResponse({ user: toUserDTO(created!) }, 201)
}