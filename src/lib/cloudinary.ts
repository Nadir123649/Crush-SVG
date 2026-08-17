import 'server-only'

import { v2 as cloudinary } from 'cloudinary'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set`)
  }
  return value
}

cloudinary.config({
  cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
  api_key: requireEnv('CLOUDINARY_API_KEY'),
  api_secret: requireEnv('CLOUDINARY_API_SECRET'),
})

export { cloudinary }

export async function uploadImage(
  file: Buffer,
  folder: string = 'crushsvg',
  options: Record<string, unknown> = {}
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(file)
  })
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}