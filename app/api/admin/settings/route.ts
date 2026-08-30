import "server-only"
import { z } from "zod"
import { getSettings, updateSettings } from "@/lib/settings"
import { getTotalTreesReservedForYear } from "@/lib/reservations"
import { enforceSameOrigin, logApiError, parseJsonBody, requireAdminSessionResponse } from "@/lib/api"
import { getActiveYear, getViewYear } from "@/lib/years"

const settingsSchema = z.object({
  availableDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum.")).max(366, "Legfeljebb 366 nap adható meg.").optional(),
  maxBookingsPerDay: z.number({ invalid_type_error: "Érvénytelen szám." }).int("Egész számot adj meg.").min(1, "Minimum 1 foglalás naponta.").max(500, "Maximum 500 foglalás naponta.").optional(),
  maxTreesPerSeason: z.number({ invalid_type_error: "Érvénytelen szám." }).int("Egész számot adj meg.").min(1, "Minimum 1 fa szezononként.").max(100000, "Maximum 100000 fa szezononként.").optional(),
  retrievalDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum.")).max(366, "Legfeljebb 366 nap adható meg.").optional(),
  pricePerTree: z.number({ invalid_type_error: "Érvénytelen ár." }).int("Egész számot adj meg.").min(0, "Az ár nem lehet negatív.").max(100000000, "Túl magas ár.").optional(),
})

// GET semantics:
//   - public, no `?year=`     → returns active year's settings (booking page, calendar picker)
//   - public, no active year  → 503 with "Foglalás jelenleg nem elérhető"
//   - `?year=X`               → returns that year's settings; requires admin auth so customers
//                               can't browse historical/future seasons by guessing the year.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")

    if (yearParam !== null) {
      const authError = await requireAdminSessionResponse()
      if (authError) return authError

      const year = Number.parseInt(yearParam, 10)
      if (!Number.isInteger(year) || year < 2000 || year > 3000) {
        return Response.json({ success: false, error: "Érvénytelen év" }, { status: 400 })
      }
      const settings = await getSettings(year)
      return Response.json(
        { success: true, settings },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      )
    }

    const activeYear = await getActiveYear()
    if (activeYear === null) {
      return Response.json(
        { success: false, error: "Foglalás jelenleg nem elérhető" },
        { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
      )
    }
    const settings = await getSettings(activeYear)
    const treesReserved = await getTotalTreesReservedForYear(activeYear)
    const isSeasonSoldOut = treesReserved >= settings.maxTreesPerSeason
    const { maxTreesPerSeason, ...publicSettings } = settings
    return Response.json(
      { success: true, settings: publicSettings, isSeasonSoldOut },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  } catch (error) {
    logApiError("settings fetch failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const parsedBody = await parseJsonBody(request, settingsSchema)
    if (!parsedBody.success) return parsedBody.response

    const year = await getViewYear()

    if (parsedBody.data.maxTreesPerSeason !== undefined) {
      const treesReserved = await getTotalTreesReservedForYear(year)
      if (parsedBody.data.maxTreesPerSeason < treesReserved) {
        return Response.json(
          {
            success: false,
            error: `A szezonális limit nem lehet kevesebb, mint a már megrendelt fák száma (${treesReserved} db).`,
          },
          { status: 400 },
        )
      }
    }

    const settings = await updateSettings(year, parsedBody.data)

    return Response.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    logApiError("settings update failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}
