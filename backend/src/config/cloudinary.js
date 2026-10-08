import { v2 as cloudinary } from "cloudinary"
import { Readable } from "node:stream"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret)

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export function isCloudinaryConfigured() {
  return cloudinaryConfigured
}

export function uploadProductImage(buffer) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: "nobluff/products", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )

    Readable.from(buffer).pipe(upload)
  })
}