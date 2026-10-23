import { NextRequest, NextResponse } from 'next/server'
import { GridFSBucket, ObjectId } from 'mongodb'
import { Readable } from 'node:stream'
import { connectToDatabase } from '@/lib/database/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  try {
    const connection = await connectToDatabase()
    if (!connection.db) throw new Error('MongoDB database connection is unavailable')

    const bucket = new GridFSBucket(connection.db, { bucketName: 'blogImages' })
    const file = await bucket.find({ _id: new ObjectId(id) }).next()
    if (!file) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

    const contentType = file.metadata?.contentType
    if (typeof contentType !== 'string' || !allowedImageTypes.has(contentType)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })
    }

    const imageStream = bucket.openDownloadStream(file._id)
    const body = Readable.toWeb(imageStream) as ReadableStream<Uint8Array>

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(file.length),
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Blog image retrieval failed:', error)
    return NextResponse.json({ error: 'Unable to load image' }, { status: 500 })
  }
}
