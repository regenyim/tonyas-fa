import "server-only"
import { z } from "zod"
import { createExpense, listExpenses } from "@/lib/expenses"
import { enforceSameOrigin, logApiError, parseJsonBody, requireAdminSessionResponse } from "@/lib/api"
import { getViewYear } from "@/lib/years"

const createExpenseSchema = z.object({
  person: z.union([z.literal("János"), z.literal("Sanyi")], { errorMap: () => ({ message: "Érvénytelen személy." }) }),
  amount: z.number({ invalid_type_error: "Érvénytelen összeg." }).positive("Az összeg pozitív szám kell legyen.").max(100000000, "Túl magas összeg."),
  description: z.string().trim().min(1, "Leírás szükséges.").max(200, "A leírás legfeljebb 200 karakter lehet."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátumformátum."),
})

export async function GET() {
  try {
    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const year = await getViewYear()
    const expenses = await listExpenses({ year })
    return Response.json({ success: true, expenses, year })
  } catch (error) {
    logApiError("admin expenses list failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const authError = await requireAdminSessionResponse()
    if (authError) return authError

    const parsedBody = await parseJsonBody(request, createExpenseSchema)
    if (!parsedBody.success) return parsedBody.response

    const year = await getViewYear()
    const result = await createExpense(parsedBody.data, year)

    if (result.success) {
      return Response.json({ success: true, expense: result.data })
    }

    return Response.json({ success: false, error: result.error }, { status: 400 })
  } catch (error) {
    logApiError("admin expense create failed", error)
    return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}
