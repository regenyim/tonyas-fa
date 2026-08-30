import "server-only"
import { activateYear } from "@/lib/years"
import { enforceSameOrigin, logApiError, requireAdminSessionResponse } from "@/lib/api"

function parseYear(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 3000) return null
  return parsed
}

export async function POST(request: Request, { params }: { params: Promise<{ year: string }> }) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const { year: yearParam } = await params
    const year = parseYear(yearParam)
    if (year === null) {
      return Response.json({ success: false, error: "Érvénytelen év" }, { status: 400 })
    }

    const result = await activateYear(year)
    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 400 })
    }
    return Response.json({ success: true })
  } catch (error) {
    logApiError("admin year activate failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
