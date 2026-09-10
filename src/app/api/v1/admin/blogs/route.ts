import { NextRequest } from 'next/server'

import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { Blog, AuditLog, isDuplicateKeyError } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { getClientIp } from '@/lib/security/ip'

export const runtime = 'nodejs'

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

export async function GET(request: NextRequest) {
    const rl = await checkRateLimit(request, 'admin:blogs:list', 20, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '15')))
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim()
    const published = searchParams.get('published')?.trim()

    const filter: Record<string, unknown> = {}
    const andClauses: Record<string, unknown>[] = []

    if (search) {
        andClauses.push({
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
            ]
        })
    }

    if (published === 'true') {
        andClauses.push({ published: true })
    } else if (published === 'false') {
        andClauses.push({ published: false })
    }

    if (andClauses.length === 1) {
        Object.assign(filter, andClauses[0])
    } else if (andClauses.length > 1) {
        filter.$and = andClauses
    }

    const [docs, total] = await Promise.all([
        Blog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('authorId', 'displayName email')
            .lean(),
        Blog.countDocuments(filter)
    ])

    return successResponse({
        data: docs,
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
    const rl = await checkRateLimit(request, 'admin:blogs:create', 10, 60_000)
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

    const { title, content, excerpt, coverImage, category, published = false } = body as {
        title: string
        content: string
        excerpt?: string
        coverImage?: string
        category?: string
        published?: boolean
    }

    if (!title || !title.trim()) {
        return errorResponse(400, 'invalid_title', 'Title is required', undefined, request)
    }

    if (!content || !content.trim()) {
        return errorResponse(400, 'invalid_content', 'Content is required', undefined, request)
    }

    let slug = generateSlug(title)

    // Ensure unique slug
    let existing = await Blog.findOne({ slug })
    let counter = 1
    while (existing) {
        slug = `${generateSlug(title)}-${counter}`
        existing = await Blog.findOne({ slug })
        counter++
    }

    const autoExcerpt = excerpt?.trim() || content.replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...'

    let created
    try {
        created = await Blog.create({
            title: title.trim(),
            slug,
            content: content.trim(),
            excerpt: autoExcerpt,
            coverImage: coverImage?.trim() || null,
            category: category?.trim() || "General",
            published,
            authorId: who.user.id,
        })
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return errorResponse(409, 'slug_taken', 'A blog post with this slug already exists', undefined, request)
        }
        throw error
    }

    await AuditLog.create({
        adminId: who.user.id,
        action: 'blog_created',
        target: created._id.toString(),
        resourceType: 'blog',
        resourceId: created.slug,
        details: { title: created.title, slug: created.slug, published: created.published },
        ipAddress: getClientIp(request),
        metadata: { title: created.title, slug: created.slug },
    })

    return successResponse({ blog: created }, 201, rateLimitHeaders(rl), request)
}