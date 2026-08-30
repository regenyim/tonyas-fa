import "server-only"
import { cookies } from "next/headers"
import { z } from "zod"
import { validateCredentials, createSession } from "@/lib/auth"
import { enforceSameOrigin, logApiError, parseJsonBody } from "@/lib/api"

const loginSchema = z.object({
  username: z.string().trim().min(1, "Felhasználónév szükséges.").max(100, "A felhasználónév legfeljebb 100 karakter lehet."),
  password: z.string().min(1, "Jelszó szükséges.").max(200, "A jelszó legfeljebb 200 karakter lehet."),
})

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const parsedBody = await parseJsonBody(request, loginSchema)
    if (!parsedBody.success) return parsedBody.response

    const { username, password } = parsedBody.data

    if (!username || !password) {
      return Response.json(
        {
          success: false,
          error: "Felhasználónév és jelszó szükséges",
        },
        { status: 400 },
      )
    }

    if (await validateCredentials(username, password)) {
      const sessionId = await createSession(username)

      const cookieStore = await cookies()
      cookieStore.set("admin_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 24 * 60 * 60, // 24 hours
      })

      return Response.json({
        success: true,
      })
    } else {
      return Response.json(
        {
          success: false,
          error: "Hibás felhasználónév vagy jelszó",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    logApiError("admin login failed", error)
    return Response.json(
      {
        success: false,
        error: "Szerver hiba",
      },
      { status: 500 },
    )
  }
}
