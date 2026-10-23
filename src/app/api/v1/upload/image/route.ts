import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { uploadImage } from '@/lib/integrations/cloudinary'
import type { UploadApiResponse } from 'cloudinary'

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

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
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
        const uploaded = (await uploadImage(buffer, 'crushsvg/blog')) as UploadApiResponse

        return successResponse({ url: uploaded.secure_url }, 200, rateLimitHeaders(rl), request)
    } catch (error) {
        console.error('Image upload failed:', error)
        return errorResponse(500, 'upload_failed', 'Failed to upload image', undefined, request)
    }
}
