import { NextRequest } from 'next/server'
import { Blog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    const rl = await checkRateLimit(request, 'blog:list', 30, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = { published: true }

    const [docs, total] = await Promise.all([
        Blog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('authorId', 'displayName')
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