import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rl = await checkRateLimit(request, 'admin:blogs:get', 30, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error

    const { id } = await params
    if (!id) {
        return errorResponse(400, 'bad_request', 'Missing id parameter', undefined, request)
    }

    const blog = await Blog.findById(id).populate('authorId', 'displayName email').lean()
    if (!blog) {
        return errorResponse(404, 'not_found', 'Blog post not found', undefined, request)
    }

    return successResponse({ blog })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rl = await checkRateLimit(request, 'admin:blogs:update', 20, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error
    const who = adminCheck

    const { id } = await params
    if (!id) {
        return errorResponse(400, 'bad_request', 'Missing id parameter', undefined, request)
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return errorResponse(400, 'invalid_json', 'Invalid JSON body', undefined, request)
    }

    const { title, content, excerpt, coverImage, category, published } = body

    const blog = await Blog.findById(id)
    if (!blog) {
        return errorResponse(404, 'not_found', 'Blog post not found', undefined, request)
    }

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
            return errorResponse(400, 'invalid_title', 'Title cannot be empty', undefined, request)
        }
        blog.title = title.trim()
    }

    if (content !== undefined) {
        if (typeof content !== 'string' || content.trim().length === 0) {
            return errorResponse(400, 'invalid_content', 'Content cannot be empty', undefined, request)
        }
        blog.content = content.trim()
    }

    if (excerpt !== undefined) {
        blog.excerpt = excerpt?.trim() || blog.content.replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...'
    }

    if (coverImage !== undefined) {
        blog.coverImage = coverImage?.trim() || null
    }

    if (category !== undefined) {
        blog.category = category?.trim() || "General"
    }

    if (published !== undefined) {
        if (typeof published !== 'boolean') {
            return errorResponse(400, 'invalid_published', 'Published must be a boolean', undefined, request)
        }
        blog.published = published
    }

    // If title changed, regenerate slug (but keep existing slug for SEO if possible)
    // For simplicity, we'll just keep the existing slug unless it's a new post
    // If user really wants to change slug, they can do it manually via DB

    try {
        await blog.save()
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return errorResponse(409, 'slug_taken', 'A blog post with this slug already exists', undefined, request)
        }
        throw error
    }

    await AuditLog.create({
        adminId: who.user.id,
        action: 'blog_updated',
        target: blog._id.toString(),
        resourceType: 'blog',
        resourceId: blog.slug,
        details: { title: blog.title, slug: blog.slug, published: blog.published },
        ipAddress: getClientIp(request),
        metadata: { title: blog.title, slug: blog.slug },
    })

    return successResponse({ updated: true, blog }, 200, rateLimitHeaders(rl), request)
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rl = await checkRateLimit(request, 'admin:blogs:delete', 10, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error
    const who = adminCheck

    const { id } = await params
    if (!id) {
        return errorResponse(400, 'bad_request', 'Missing id parameter', undefined, request)
    }

    const blog = await Blog.findById(id)
    if (!blog) {
        return errorResponse(404, 'not_found', 'Blog post not found', undefined, request)
    }

    await Blog.deleteOne({ _id: id })

    await AuditLog.create({
        adminId: who.user.id,
        action: 'blog_deleted',
        target: id,
        resourceType: 'blog',
        resourceId: blog.slug,
        details: { title: blog.title, slug: blog.slug },
        ipAddress: getClientIp(request),
        metadata: { title: blog.title, slug: blog.slug },
    })

    return successResponse({ deleted: true, id }, 200, rateLimitHeaders(rl), request)
}