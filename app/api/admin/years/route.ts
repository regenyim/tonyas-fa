import "server-only"
import { z } from "zod"
import { createYear, listYearsWithCounts } from "@/lib/years"
import { enforceSameOrigin, logApiError, parseJsonBody, requireAdminSessionResponse } from "@/lib/api"

const createYearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
})

export async function GET() {
  try {
    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const years = await listYearsWithCounts()
    return Response.json({ success: true, years })
  } catch (error) {
    logApiError("admin years list failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const parsed = await parseJsonBody(request, createYearSchema)
    if (!parsed.success) return parsed.response

    const result = await createYear(parsed.data.year)
    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 400 })
    }
    return Response.json({ success: true, year: result.data })
  } catch (error) {
    logApiError("admin year create failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
