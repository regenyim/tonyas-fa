import "server-only"
import { enforceSameOrigin, logApiError, requireAdminSessionResponse } from "@/lib/api"
import { destroyReservationPhoto, uploadReservationPhoto } from "@/lib/cloudinary"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("photo")

    if (!(file instanceof File)) {
      return Response.json({ success: false, error: "A fotó fájl hiányzik." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json({ success: false, error: "Csak JPG, PNG, WEBP, HEIC vagy HEIF kép töltheto fel." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ success: false, error: "A kép legfeljebb 10 MB lehet." }, { status: 400 })
    }

    const uploaded = await uploadReservationPhoto(file)
    return Response.json({ success: true, ...uploaded })
  } catch (error) {
    logApiError("admin reservation photo upload failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const body = await request.json().catch(() => null) as { photoPublicId?: string } | null
    const photoPublicId = body?.photoPublicId?.trim()
    if (!photoPublicId) {
      return Response.json({ success: false, error: "Hiányzó fotó azonosító." }, { status: 400 })
    }

    await destroyReservationPhoto(photoPublicId)
    return Response.json({ success: true })
  } catch (error) {
    logApiError("admin reservation photo cleanup failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}

