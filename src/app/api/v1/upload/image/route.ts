import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { connectToDatabase } from '@/lib/database/db'
import { GridFSBucket } from 'mongodb'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(request, 'admin:upload:image', 30, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error

    let file: FormDataEntryValue | null
    try {
        const formData = await request.formData()
        file = formData.get('file')
    } catch {
        return errorResponse(400, 'invalid_form_data', 'Could not read the uploaded image', undefined, request)
    }

    if (!(file instanceof File)) {
        return errorResponse(400, 'no_file', 'No file provided', undefined, request)
    }

    const extensionByType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif',
    }
    const extension = extensionByType[file.type]
    if (!extension) {
        return errorResponse(400, 'invalid_type', 'File must be an image', undefined, request)
    }

    if (file.size === 0) {
        return errorResponse(400, 'empty_file', 'The selected image is empty', undefined, request)
    }

    if (file.size > 5 * 1024 * 1024) {
        return errorResponse(400, 'file_too_large', 'Image must be less than 5MB', undefined, request)
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const connection = await connectToDatabase()
        if (!connection.db) throw new Error('MongoDB database connection is unavailable')

        const bucket = new GridFSBucket(connection.db, { bucketName: 'blogImages' })
        const upload = bucket.openUploadStream(`blog-${randomUUID()}.${extension}`, {
            metadata: { contentType: file.type, uploadedBy: adminCheck.user.id },
        })
        const stored = once(upload, 'finish')
        upload.end(buffer)
        await stored

        return successResponse({ url: `/api/v1/blog/image?id=${upload.id.toString()}` }, 200, rateLimitHeaders(rl), request)
    } catch (error) {
        console.error('Blog image upload failed:', error)
        return errorResponse(500, 'upload_failed', 'Image upload failed. Check the server logs for the upload request.', undefined, request)
    }
}
