import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(request, 'admin:upload:image', 30, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
        return errorResponse(400, 'no_file', 'No file provided', undefined, request)
    }

    if (!file.type.startsWith('image/')) {
        return errorResponse(400, 'invalid_type', 'File must be an image', undefined, request)
    }

    if (file.size > 5 * 1024 * 1024) {
        return errorResponse(400, 'file_too_large', 'Image must be less than 5MB', undefined, request)
    }

    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'blog')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
        const filename = `blog-${uuidv4()}.${extension}`
        const filepath = join(uploadDir, filename)

        await writeFile(filepath, buffer)

        const url = `/uploads/blog/${filename}`

        return successResponse({ url }, 200, rateLimitHeaders(rl), request)
    } catch (error) {
        console.error('Image upload failed:', error)
        return errorResponse(500, 'upload_failed', 'Failed to upload image', undefined, request)
    }
}