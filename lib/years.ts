import "server-only"
import { cookies } from "next/headers"
import { sql } from "./db"
import type { Year, YearWithCounts, Settings } from "./types"

const VIEW_YEAR_COOKIE = "admin_view_year"

function rowToYear(row: any): Year {
  return {
    year: Number(row.year),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  }
}

export async function listYears(): Promise<Year[]> {
  const rows = await sql`SELECT year, is_active, created_at FROM years ORDER BY year DESC`
  return rows.map(rowToYear)
}

export async function listYearsWithCounts(): Promise<YearWithCounts[]> {
  const rows = await sql`
    SELECT
      y.year,
      y.is_active,
      y.created_at,
      (SELECT COUNT(*) FROM reservations r WHERE r.year = y.year) AS reservation_count,
      (SELECT COUNT(*) FROM expenses e WHERE e.year = y.year)     AS expense_count
    FROM years y
    ORDER BY y.year DESC
  `
  return rows.map((row: any) => ({
    ...rowToYear(row),
    reservationCount: Number(row.reservation_count),
    expenseCount: Number(row.expense_count),
  }))
}

export async function getActiveYear(): Promise<number | null> {
  const rows = await sql`SELECT year FROM years WHERE is_active = TRUE LIMIT 1`
  return rows.length > 0 ? Number(rows[0].year) : null
}

// Resolve which year the admin is viewing. Order: explicit cookie → active year → calendar year.
export async function getViewYear(): Promise<number> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(VIEW_YEAR_COOKIE)?.value
  if (raw) {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isInteger(parsed) && parsed >= 2000 && parsed <= 3000) {
      const exists = await sql`SELECT 1 FROM years WHERE year = ${parsed}`
      if (exists.length > 0) return parsed
    }
  }
  const active = await getActiveYear()
  if (active !== null) return active
  return new Date().getFullYear()
}

export async function yearExists(year: number): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM years WHERE year = ${year}`
  return rows.length > 0
}

export async function createYear(
  year: number,
): Promise<{ success: boolean; data?: Year; error?: string }> {
  if (!Number.isInteger(year) || year < 2000 || year > 3000) {
    return { success: false, error: "Érvénytelen év" }
  }
  if (await yearExists(year)) {
    return { success: false, error: `A(z) ${year}-os év már létezik` }
  }

  // Pull the most recent prior year's settings as a template (excluding available_days,
  // which always need to be picked fresh per season).
  const priorRows = await sql`
    SELECT max_bookings_per_day, max_trees_per_season, retrieval_days, price
    FROM settings
    WHERE year < ${year}
    ORDER BY year DESC
    LIMIT 1
  `
  const template = priorRows[0]
  const maxBookings = template ? Number(template.max_bookings_per_day) : 20
  const maxTreesPerSeason = template ? Number(template.max_trees_per_season) : 500
  const retrievalDays = template?.retrieval_days ?? ""
  const price = template ? Number(template.price) : 8000

  await sql.transaction([
    sql`INSERT INTO years (year, is_active) VALUES (${year}, FALSE)`,
    sql`
      INSERT INTO settings (year, available_days, max_bookings_per_day, max_trees_per_season, retrieval_days, price)
      VALUES (${year}, '', ${maxBookings}, ${maxTreesPerSeason}, ${retrievalDays}, ${price})
    `,
  ])

  const rows = await sql`SELECT year, is_active, created_at FROM years WHERE year = ${year}`
  return { success: true, data: rowToYear(rows[0]) }
}

export async function deleteYear(
  year: number,
): Promise<{ success: boolean; error?: string }> {
  const yearRows = await sql`SELECT is_active FROM years WHERE year = ${year}`
  if (yearRows.length === 0) {
    return { success: false, error: `A(z) ${year}-os év nem létezik` }
  }
  if (yearRows[0].is_active) {
    return { success: false, error: "Aktív évet nem lehet törölni" }
  }

  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM reservations WHERE year = ${year}) AS reservations,
      (SELECT COUNT(*) FROM expenses     WHERE year = ${year}) AS expenses
  `
  const reservationCount = Number(counts[0].reservations)
  const expenseCount = Number(counts[0].expenses)

  if (reservationCount > 0 || expenseCount > 0) {
    return {
      success: false,
      error: `Nem törölhető: ${reservationCount} foglalás és ${expenseCount} kiadás tartozik a(z) ${year}-os évhez.`,
    }
  }

  await sql.transaction([
    sql`DELETE FROM settings WHERE year = ${year}`,
    sql`DELETE FROM years WHERE year = ${year}`,
  ])
  return { success: true }
}

export async function activateYear(
  year: number,
): Promise<{ success: boolean; error?: string }> {
  if (!(await yearExists(year))) {
    return { success: false, error: `A(z) ${year}-os év nem létezik` }
  }

  await sql.transaction([
    sql`UPDATE years SET is_active = FALSE WHERE is_active = TRUE`,
    sql`UPDATE years SET is_active = TRUE  WHERE year = ${year}`,
  ])
  return { success: true }
}

export const VIEW_YEAR_COOKIE_NAME = VIEW_YEAR_COOKIE

// Lazy default settings used when a year row is missing from the settings table
// (shouldn't happen for years created via createYear, but guards against manual
// schema changes or partial migrations).
export function defaultSettingsFor(year: number): Settings {
  return {
    year,
    availableDays: [],
    maxBookingsPerDay: 20,
    maxTreesPerSeason: 500,
    retrievalDays: [],
    pricePerTree: 8000,
  }
}
