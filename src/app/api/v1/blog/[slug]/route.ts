import { NextRequest } from 'next/server'
import { Blog } from '@/lib/database/db'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const rl = await checkRateLimit(request, 'blog:get', 60, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const { slug } = await params
    if (!slug) {
        return errorResponse(400, 'bad_request', 'Missing slug parameter', undefined, request)
    }

    const blog = await Blog.findOne({ slug, published: true })
        .populate('authorId', 'displayName')
        .lean()

    if (!blog) {
        return errorResponse(404, 'not_found', 'Blog post not found', undefined, request)
    }

    return successResponse({ blog })
}