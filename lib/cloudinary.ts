import "server-only"
import crypto from "node:crypto"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

function requireCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are missing")
  }
}

function signParams(params: Record<string, string>) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex")
}

export async function uploadReservationPhoto(file: File, folder = "reservations") {
  requireCloudinaryConfig()

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const transformation = "c_limit,w_2048,h_2048,q_auto:good"
  const paramsToSign = {
    folder,
    timestamp,
    transformation,
    use_filename: "false",
    unique_filename: "true",
  }

  const signature = signParams(paramsToSign)
  const form = new FormData()
  form.set("file", file)
  form.set("api_key", apiKey!)
  form.set("timestamp", timestamp)
  form.set("folder", folder)
  form.set("transformation", transformation)
  form.set("use_filename", "false")
  form.set("unique_filename", "true")
  form.set("signature", signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary upload failed: ${errorText}`)
  }

  const payload = await response.json() as {
    secure_url?: string
    public_id?: string
  }

  if (!payload.secure_url || !payload.public_id) {
    throw new Error("Cloudinary upload returned missing fields")
  }

  return {
    photoUrl: payload.secure_url,
    photoPublicId: payload.public_id,
  }
}

export async function destroyReservationPhoto(publicId: string) {
  requireCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = signParams({ public_id: publicId, timestamp })

  const form = new FormData()
  form.set("public_id", publicId)
  form.set("timestamp", timestamp)
  form.set("api_key", apiKey!)
  form.set("signature", signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary destroy failed: ${errorText}`)
  }
}

