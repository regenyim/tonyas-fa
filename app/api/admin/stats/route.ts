import "server-only"
import { getReservationStats } from "@/lib/reservations"
import { logApiError, requireAdminSessionResponse } from "@/lib/api"
import { getViewYear } from "@/lib/years"

export async function GET(_request: Request) {
  try {
    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const year = await getViewYear()
    const stats = await getReservationStats(year)

    return Response.json({
      success: true,
      stats,
      year,
    })
  } catch (error) {
    logApiError("admin stats fetch failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}
