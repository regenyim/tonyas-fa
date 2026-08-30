import "server-only"
import { z } from "zod"
import { addReservationPhoto, getReservationById } from "@/lib/reservations"
import { enforceSameOrigin, logApiError, parseJsonBody, parseNumericId, requireAdminSessionResponse } from "@/lib/api"

const createPhotoSchema = z.object({
  photoUrl: z.string().url("Érvénytelen fotó URL."),
  photoPublicId: z.string().trim().min(1, "Érvénytelen fotó azonosító.").max(255, "Érvénytelen fotó azonosító."),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const { id } = await params
    const reservationId = parseNumericId(id)
    if (!reservationId) {
      return Response.json({ success: false, error: "Érvénytelen foglalás azonosító" }, { status: 400 })
    }

    const parsedBody = await parseJsonBody(request, createPhotoSchema)
    if (!parsedBody.success) return parsedBody.response

    const result = await addReservationPhoto(reservationId, parsedBody.data)
    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 404 })
    }

    const reservation = await getReservationById(reservationId)
    return Response.json({ success: true, photo: result.data, reservation })
  } catch (error) {
    logApiError("admin reservation photo create failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
