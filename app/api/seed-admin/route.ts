import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { z } from "zod"
import { hashPassword } from "@/lib/auth"
import { logApiError, parseJsonBody } from "@/lib/api"

const seedSchema = z.object({
  username: z.string().trim().min(1).max(100).default("admin"),
  password: z.string().min(5).max(200),
})

export async function POST(req: Request) {
  try {
    if (!process.env.SEED_ADMIN_KEY) {
      return NextResponse.json({ success: false, error: "SEED_ADMIN_KEY nincs beállítva" }, { status: 503 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: "DATABASE_URL nincs beállítva" }, { status: 503 })
    }

    if (req.headers.get("x-seed-key") !== process.env.SEED_ADMIN_KEY) {
      return NextResponse.json({ success: false, error: "Nem engedélyezett" }, { status: 401 })
    }

    const parsedBody = await parseJsonBody(req, seedSchema)
    if (!parsedBody.success) return parsedBody.response

    const sql = neon(process.env.DATABASE_URL)
    const { username, password } = parsedBody.data
    const hashedPassword = await hashPassword(password)

    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES (${username}, ${hashedPassword})
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("admin seed failed", error)
    return NextResponse.json({ success: false, error: "Szerver hiba" }, { status: 500 })
  }
}

