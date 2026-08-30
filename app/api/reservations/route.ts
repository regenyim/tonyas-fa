import { z } from "zod"
import { createReservation, getTotalTreesReservedForYear } from "@/lib/reservations"
import { getSettings } from "@/lib/settings"
import { logApiError, parseJsonBody } from "@/lib/api"
import { sendNewReservationNotification } from "@/lib/reservation-notifications"
import { getActiveYear } from "@/lib/years"

export const runtime = "nodejs"

function buildReservationSchema(maxTrees: number) {
  return z.object({
    name: z.string().trim().min(1, "Név szükséges.").max(120, "A név legfeljebb 120 karakter lehet."),
    phone: z.string().trim().min(1, "Telefonszám szükséges.").max(50, "A telefonszám legfeljebb 50 karakter lehet."),
    email: z.union([z.string().trim().email("Érvénytelen e-mail cím."), z.literal(""), z.undefined()]).optional(),
    visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum."),
    pickupDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum."), z.literal(""), z.undefined()]).optional(),
    treeCount: z.number({ invalid_type_error: "Érvénytelen faszám." }).int("Egész számot adj meg.").min(1, "Minimum 1 fa szükséges.").max(maxTrees, `Maximum ${maxTrees} fa rendelhető egyszerre.`),
    notes: z.union([z.string().trim().max(1000, "A megjegyzés legfeljebb 1000 karakter lehet."), z.literal(""), z.undefined()]).optional(),
  })
}

export async function POST(request: Request) {
  try {
    const activeYear = await getActiveYear()
    if (activeYear === null) {
      return Response.json(
        {
          success: false,
          errors: ["Foglalás jelenleg nem elérhető"],
        },
        { status: 503 },
      )
    }

    const settings = await getSettings(activeYear)
    const reservationSchema = buildReservationSchema(settings.maxBookingsPerDay)
    const parsedBody = await parseJsonBody(request, reservationSchema)
    if (!parsedBody.success) return parsedBody.response

    const data = parsedBody.data

    if (settings.availableDays.length === 0 || !settings.availableDays.includes(data.visitDate)) {
      return Response.json(
        { success: false, errors: ["A választott nap nem elérhető foglalásra."] },
        { status: 400 },
      )
    }

    if (settings.retrievalDays.length > 0 && !data.pickupDate) {
      return Response.json(
        { success: false, errors: ["Az átvételi nap megadása kötelező."] },
        { status: 400 },
      )
    }

    if (data.pickupDate && settings.retrievalDays.length > 0 && !settings.retrievalDays.includes(data.pickupDate)) {
      return Response.json(
        { success: false, errors: ["A választott átvételi nap nem elérhető."] },
        { status: 400 },
      )
    }

    const treesReserved = await getTotalTreesReservedForYear(activeYear)
    const remaining = settings.maxTreesPerSeason - treesReserved
    if (remaining <= 0) {
      return Response.json(
        { success: false, errors: ["Sajnáljuk, erre a szezonra elfogyott az összes fa."] },
        { status: 400 },
      )
    }
    if (data.treeCount > remaining) {
      return Response.json(
        { success: false, errors: [`Sajnáljuk, jelenleg a készleteink végén járunk — maximum ${remaining} db fát tudunk biztosítani, de te ${data.treeCount} db-ot kértél. Kérjük, csökkentsd a darabszámot.`] },
        { status: 400 },
      )
    }

    const result = await createReservation(
      {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        visitDate: data.visitDate,
        pickupDate: data.pickupDate || undefined,
        treeCount: data.treeCount,
        notes: data.notes || undefined,
      },
      activeYear,
    )

    if (!result.success) {
      return Response.json(
        {
          success: false,
          errors: result.errors,
        },
        { status: 400 },
      )
    }

    try {
      await sendNewReservationNotification(result.data)
    } catch (error) {
      logApiError("reservation notification email failed", error)
    }

    return Response.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    logApiError("public reservation create failed", error)
    return Response.json(
      {
        success: false,
        errors: ["Szerver hiba. Kérjük, próbáld újra."],
      },
      { status: 500 },
    )
  }
}
