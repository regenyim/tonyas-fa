import "server-only"
import { sql } from "./db"
import { defaultSettingsFor } from "./years"
import type { Settings } from "./types"

function rowToSettings(row: any): Settings {
  return {
    year: Number(row.year),
    availableDays: row.available_days ? row.available_days.split(",").filter(Boolean) : [],
    maxBookingsPerDay: Number(row.max_bookings_per_day),
    maxTreesPerSeason: Number(row.max_trees_per_season),
    retrievalDays: row.retrieval_days ? row.retrieval_days.split(",").filter(Boolean) : [],
    pricePerTree: Number(row.price),
  }
}

// Returns the settings for a specific year. If no row exists yet (e.g. a brand-new year that
// hasn't been configured), falls back to the in-memory defaults from lib/years.ts so the
// caller never has to handle null.
export async function getSettings(year: number): Promise<Settings> {
  const rows = await sql`SELECT * FROM settings WHERE year = ${year}`
  if (rows.length === 0) return defaultSettingsFor(year)
  return rowToSettings(rows[0])
}

// UPSERT: insert a fresh settings row for the year if missing, otherwise update only the
// supplied fields. Mirrors the dynamic-update pattern used by lib/reservations.ts but with
// a single ON CONFLICT clause to avoid an extra round-trip.
export async function updateSettings(
  year: number,
  newSettings: Partial<Settings>,
): Promise<Settings> {
  // Ensure a row exists for the year so the partial UPDATE below can hit it.
  await sql`
    INSERT INTO settings (year, available_days, max_bookings_per_day, max_trees_per_season, retrieval_days, price)
    VALUES (${year}, '', 20, 500, '', 8000)
    ON CONFLICT (year) DO NOTHING
  `

  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (newSettings.availableDays !== undefined) {
    updates.push(`available_days = $${paramIndex++}`)
    values.push(newSettings.availableDays.join(","))
  }
  if (newSettings.maxBookingsPerDay !== undefined) {
    updates.push(`max_bookings_per_day = $${paramIndex++}`)
    values.push(newSettings.maxBookingsPerDay)
  }
  if (newSettings.maxTreesPerSeason !== undefined) {
    updates.push(`max_trees_per_season = $${paramIndex++}`)
    values.push(newSettings.maxTreesPerSeason)
  }
  if (newSettings.retrievalDays !== undefined) {
    updates.push(`retrieval_days = $${paramIndex++}`)
    values.push(newSettings.retrievalDays.join(","))
  }
  if (newSettings.pricePerTree !== undefined) {
    updates.push(`price = $${paramIndex++}`)
    values.push(newSettings.pricePerTree)
  }

  if (updates.length === 0) {
    return getSettings(year)
  }

  values.push(year)
  const query = `UPDATE settings SET ${updates.join(", ")} WHERE year = $${paramIndex} RETURNING *`
  const rows = await sql.query(query, values)
  return rowToSettings(rows[0])
}
