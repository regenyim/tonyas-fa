import "server-only"
import { deleteReservationPhoto, getReservationPhotoById } from "@/lib/reservations"
import { destroyReservationPhoto } from "@/lib/cloudinary"
import { enforceSameOrigin, logApiError, parseNumericId, requireAdminSessionResponse } from "@/lib/api"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const { id, photoId } = await params
    const reservationId = parseNumericId(id)
    const parsedPhotoId = parseNumericId(photoId)
    if (!reservationId || !parsedPhotoId) {
      return Response.json({ success: false, error: "Érvénytelen azonosító" }, { status: 400 })
    }

    const existingPhoto = await getReservationPhotoById(reservationId, parsedPhotoId)
    if (!existingPhoto) {
      return Response.json({ success: false, error: "Fotó nem található" }, { status: 404 })
    }

    try {
      await destroyReservationPhoto(existingPhoto.photoPublicId)
    } catch (cleanupError) {
      logApiError("reservation photo cloudinary delete failed", cleanupError)
    }

    const result = await deleteReservationPhoto(reservationId, parsedPhotoId)
    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    logApiError("admin reservation photo delete failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
