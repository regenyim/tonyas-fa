import "server-only"
import { z } from "zod"
import { cookies } from "next/headers"
import { enforceSameOrigin, logApiError, parseJsonBody, requireAdminSessionResponse } from "@/lib/api"
import { VIEW_YEAR_COOKIE_NAME, yearExists } from "@/lib/years"

const viewYearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
})

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const parsed = await parseJsonBody(request, viewYearSchema)
    if (!parsed.success) return parsed.response

    const { year } = parsed.data
    if (!(await yearExists(year))) {
      return Response.json({ success: false, error: `A(z) ${year}-os év nem létezik` }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set(VIEW_YEAR_COOKIE_NAME, String(year), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    })

    return Response.json({ success: true, year })
  } catch (error) {
    logApiError("admin view-year set failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
