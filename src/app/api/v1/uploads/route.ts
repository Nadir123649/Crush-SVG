import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth-middleware'
import { uploadImage } from '@/lib/cloudinary'
import type { UploadApiResponse } from 'cloudinary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const who = await auth(request)
  if ('error' in who) return who.error

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.' },
      { status: 400 }
    )
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 10MB.' },
      { status: 400 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, 'crushsvg/uploads', {
      public_id: `${who.user.id}_${Date.now()}`,
    }) as UploadApiResponse

    return NextResponse.json(
      {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}