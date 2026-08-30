import "server-only"
import { z } from "zod"
import { deleteReservation, findConflictingTreeNumbers, getReservationById, updateReservation } from "@/lib/reservations"
import { ReservationStatus } from "@/lib/types"
import { destroyReservationPhoto } from "@/lib/cloudinary"
import { enforceSameOrigin, logApiError, parseJsonBody, parseNumericId, requireAdminSessionResponse } from "@/lib/api"

const updateReservationSchema = z
  .object({
    name: z.string().trim().min(1, "Név szükséges.").max(120, "A név legfeljebb 120 karakter lehet.").optional(),
    phone: z.string().trim().min(1, "Telefonszám szükséges.").max(50, "A telefonszám legfeljebb 50 karakter lehet.").optional(),
    email: z.union([z.string().trim().email("Érvénytelen e-mail cím."), z.literal(""), z.null()]).optional(),
    visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum.").optional(),
    pickupDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum."), z.literal(""), z.null()]).optional(),
    treeCount: z.number({ invalid_type_error: "Érvénytelen faszám." }).int("Egész számot adj meg.").min(1, "Minimum 1 fa szükséges.").max(20, "Maximum 20 fa adható meg.").optional(),
    status: z.nativeEnum(ReservationStatus, { errorMap: () => ({ message: "Érvénytelen státusz." }) }).optional(),
    treeNumbers: z.union([z.string().trim().max(200, "A sorszámok legfeljebb 200 karakter lehetnek."), z.literal(""), z.null()]).optional(),
    notes: z.union([z.string().trim().max(1000, "A megjegyzés legfeljebb 1000 karakter lehet."), z.literal(""), z.null()]).optional(),
    paidTo: z.union([z.literal("János"), z.literal("Sanyi"), z.literal(""), z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Legalább egy mezőt meg kell adni.",
  })

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const { id } = await params
    const reservationId = parseNumericId(id)
    if (!reservationId) {
      return Response.json({ success: false, error: "Érvénytelen foglalás azonosító" }, { status: 400 })
    }

    const reservation = await getReservationById(reservationId)

    if (!reservation) {
      return Response.json(
        {
          success: false,
          error: "Foglalás nem található",
        },
        { status: 404 },
      )
    }

    return Response.json({
      success: true,
      reservation,
    })
  } catch (error) {
    logApiError("admin reservation fetch failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const parsedBody = await parseJsonBody(request, updateReservationSchema)
    if (!parsedBody.success) return parsedBody.response

    const data = parsedBody.data
    const existing = await getReservationById(reservationId)
    if (!existing) {
      return Response.json({ success: false, error: "Foglalás nem található" }, { status: 404 })
    }

    if (data.treeNumbers && data.treeNumbers.trim()) {
      const treeNumbers = data.treeNumbers
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0)

      if (treeNumbers.length > 0) {
        const { conflictingNumbers, reservationNames } = await findConflictingTreeNumbers(
          treeNumbers,
          existing.year,
          reservationId,
        )
        if (conflictingNumbers.length > 0) {
          const details = conflictingNumbers
            .map((num) => `${num} (${reservationNames.get(num)})`)
            .join(", ")
          return Response.json(
            { success: false, error: `A következő fa sorszámok már foglaltak: ${details}` },
            { status: 400 },
          )
        }
      }
    }

    const result = await updateReservation(reservationId, {
      name: data.name,
      phone: data.phone,
      email: data.email === "" ? undefined : data.email ?? undefined,
      visitDate: data.visitDate,
      pickupDate: data.pickupDate === "" ? undefined : data.pickupDate ?? undefined,
      treeCount: data.treeCount,
      status: data.status,
      treeNumbers: data.treeNumbers,
      notes: data.notes,
      paidTo: data.paidTo ?? undefined,
    })

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
        },
        { status: 404 },
      )
    }

    return Response.json({
      success: true,
      reservation: result.data,
    })
  } catch (error) {
    logApiError("admin reservation update failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const reservation = await getReservationById(reservationId)
    if (reservation && reservation.treeNumbers && reservation.treeNumbers.trim()) {
      console.warn(`WARNING: Deleting reservation ${reservationId} (${reservation.name}) with assigned tree numbers: ${reservation.treeNumbers}. These tree numbers will be permanently lost and cannot be reused.`)
    }

    if (reservation?.photos?.length) {
      for (const photo of reservation.photos) {
        try {
          await destroyReservationPhoto(photo.photoPublicId)
        } catch (cleanupError) {
          logApiError("reservation photo cleanup on delete failed", cleanupError)
        }
      }
    }

    const result = await deleteReservation(reservationId)

    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    logApiError("admin reservation delete failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
