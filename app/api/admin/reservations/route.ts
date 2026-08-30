import "server-only"
import { listReservations } from "@/lib/reservations"
import { ReservationStatus } from "@/lib/types"
import { logApiError, requireAdminSessionResponse } from "@/lib/api"
import { getViewYear } from "@/lib/years"

export async function GET(request: Request) {
  try {
    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status")
    const status = statusParam && Object.values(ReservationStatus).includes(statusParam as ReservationStatus)
      ? (statusParam as ReservationStatus)
      : null

    if (statusParam && !status) {
      return Response.json({ success: false, error: "Érvénytelen státusz szűrő" }, { status: 400 })
    }

    const year = await getViewYear()
    const reservations = await listReservations(status ? { year, status } : { year })

    return Response.json({
      success: true,
      reservations,
      year,
    })
  } catch (error) {
    logApiError("admin reservations list failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}
