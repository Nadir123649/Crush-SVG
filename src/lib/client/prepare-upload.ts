/**
 * Hosting platforms reject request bodies above ~4.5 MB before our route
 * handler runs (the browser only sees a failed fetch, never a JSON error).
 * Keep a safety margin for multipart overhead and the other form fields.
 */
export const SAFE_UPLOAD_BYTES = 4_000_000

const MAX_ATTEMPTS = 8
const MIN_EDGE_PX = 64
const SCALE_STEP = 0.8
const WEBP_QUALITY = 0.92
const JPEG_QUALITY = 0.9

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function extensionFor(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

function renameWithExtension(name: string, mime: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${extensionFor(mime)}`
}

/**
 * Returns a file that fits under the platform's request-body limit.
 * Files already below `maxBytes` are returned untouched. Larger ones are
 * re-encoded (alpha preserved) and, if still too big, progressively downscaled.
 * Throws if the image cannot be decoded or cannot be made small enough.
 */
export async function prepareImageForUpload(file: File, maxBytes: number = SAFE_UPLOAD_BYTES): Promise<File> {
  if (file.size <= maxBytes) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This image could not be read. Try a different file.')
  }

  try {
    const isJpeg = file.type === 'image/jpeg'
    let scale = 1

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      if (attempt > 0 && Math.min(width, height) < MIN_EDGE_PX) break

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) break
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, 0, 0, width, height)

      // JPEG stays JPEG (no alpha to lose). Everything else prefers lossy WebP,
      // which keeps transparency at a fraction of PNG's size; browsers that
      // cannot encode WebP silently return PNG, which the loop then downscales.
      const preferred = isJpeg ? 'image/jpeg' : 'image/webp'
      const blob = await canvasToBlob(canvas, preferred, isJpeg ? JPEG_QUALITY : WEBP_QUALITY)
      if (blob && blob.size <= maxBytes) {
        const type = blob.type || preferred
        return new File([blob], renameWithExtension(file.name, type), { type })
      }

      scale *= SCALE_STEP
    }
  } finally {
    bitmap.close()
  }

  throw new Error('This image is too large to upload. Try a smaller or lower-resolution image.')
}
