import "server-only"
import { sql } from "./db"
import {
  type Reservation,
  type ReservationPhoto,
  ReservationStatus,
  type CreateReservationData,
  type CreateAdminQuickReservationData,
  type UpdateReservationData,
} from "./types"

// Format a database date value to YYYY-MM-DD string without timezone shift
function formatDate(value: any): string {
  if (!value) return ""
  // If it's already a YYYY-MM-DD string, return as-is
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  // If it's an ISO string like "2025-12-06T00:00:00.000Z", extract the date part
  if (typeof value === "string" && value.includes("T")) return value.split("T")[0]
  // For Date objects, use local date parts to avoid UTC shift
  const d = new Date(value)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function rowToReservation(row: any): Reservation {
  return {
    id: row.id,
    year: Number(row.year),
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    visitDate: formatDate(row.visit_date),
    pickupDate: row.pickup_date ? formatDate(row.pickup_date) : undefined,
    treeCount: row.tree_count,
    notes: row.notes || undefined,
    treeNumbers: row.tree_numbers || undefined,
    status: row.status as ReservationStatus,
    paidTo: row.paid_to || undefined,
    photos: [],
    hasPhotos: Boolean(row.has_photos),
    createdAt: row.created_at,
  }
}

function rowToReservationPhoto(row: any): ReservationPhoto {
  return {
    id: Number(row.id),
    reservationId: Number(row.reservation_id),
    photoUrl: row.photo_url,
    photoPublicId: row.photo_public_id,
    createdAt: row.created_at,
  }
}

async function attachPhotos(reservations: Reservation[]): Promise<Reservation[]> {
  if (reservations.length === 0) return reservations
  const ids = reservations.map((r) => r.id)
  const photoRows = await sql.query(
    "SELECT id, reservation_id, photo_url, photo_public_id, created_at FROM reservation_photos WHERE reservation_id = ANY($1) ORDER BY created_at ASC",
    [ids],
  )
  const grouped = new Map<number, ReservationPhoto[]>()
  for (const row of photoRows) {
    const photo = rowToReservationPhoto(row)
    const arr = grouped.get(photo.reservationId) ?? []
    arr.push(photo)
    grouped.set(photo.reservationId, arr)
  }

  return reservations.map((reservation) => ({
    ...reservation,
    photos: grouped.get(reservation.id) ?? [],
    hasPhotos: (grouped.get(reservation.id)?.length ?? 0) > 0 || reservation.hasPhotos === true,
  }))
}

// Validation
function validateReservationData(data: CreateReservationData): string[] {
  const errors: string[] = []

  if (!data.name?.trim()) errors.push("Név szükséges")
  if (!data.phone?.trim()) errors.push("Telefonszám szükséges")
  if (!data.visitDate) errors.push("Nap szükséges")
  if (!data.treeCount || data.treeCount < 1) errors.push("Fák száma minimum 1")

  // Basic email validation if provided
  if (data.email && !data.email.includes("@")) errors.push("Érvénytelen email cím")

  return errors
}

function formatTodayLocal(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function makeAdminPlaceholderName(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const hh = String(now.getHours()).padStart(2, "0")
  const min = String(now.getMinutes()).padStart(2, "0")
  return `Admin foglalas ${yyyy}${mm}${dd}-${hh}${min}`
}

// List reservations for a given year, with optional secondary filters.
export async function listReservations(filters: {
  year: number
  visitDate?: string
  status?: ReservationStatus
}): Promise<Reservation[]> {
  let query =
    "SELECT r.*, EXISTS(SELECT 1 FROM reservation_photos rp WHERE rp.reservation_id = r.id) AS has_photos FROM reservations r WHERE r.year = $1"
  const params: any[] = [filters.year]

  if (filters.visitDate) {
    params.push(filters.visitDate)
    query += ` AND r.visit_date = $${params.length}`
  }

  if (filters.status) {
    params.push(filters.status)
    query += ` AND r.status = $${params.length}`
  }

  query += " ORDER BY r.visit_date DESC, r.created_at DESC"

  const rows = await sql.query(query, params)
  return attachPhotos(rows.map(rowToReservation))
}

// Get single reservation
export async function getReservationById(id: number): Promise<Reservation | null> {
  const rows = await sql`
    SELECT r.*, EXISTS(SELECT 1 FROM reservation_photos rp WHERE rp.reservation_id = r.id) AS has_photos
    FROM reservations r
    WHERE r.id = ${id}
  `
  if (rows.length === 0) return null
  const [reservation] = await attachPhotos([rowToReservation(rows[0])])
  return reservation
}

// Create reservation. Year is decided server-side (active year for public, view year is unused
// here because the public route is the only entry point that creates reservations).
export async function createReservation(
  data: CreateReservationData,
  year: number,
): Promise<{ success: boolean; data?: Reservation; errors?: string[] }> {
  const errors = validateReservationData(data)
  if (errors.length > 0) {
    return { success: false, errors }
  }

  const rows = await sql`
    INSERT INTO reservations (year, name, phone, email, visit_date, pickup_date, tree_count, notes, status)
    VALUES (
      ${year},
      ${data.name},
      ${data.phone},
      ${data.email || null},
      ${data.visitDate},
      ${data.pickupDate || null},
      ${data.treeCount},
      ${data.notes || null},
      ${ReservationStatus.BOOKED}
    )
    RETURNING *
  `

  return { success: true, data: rowToReservation(rows[0]) }
}

// Total trees reserved for the year, excluding no-shows, used to enforce the season-wide cap.
export async function getTotalTreesReservedForYear(year: number): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(tree_count), 0) AS total_trees
    FROM reservations
    WHERE year = ${year} AND status != ${ReservationStatus.NO_SHOW}
  `
  return Number(rows[0].total_trees)
}

function requiresTreeNumber(status: ReservationStatus) {
  return (
    status === ReservationStatus.TREE_TAGGED ||
    status === ReservationStatus.CUT ||
    status === ReservationStatus.PICKED_UP ||
    status === ReservationStatus.FREE
  )
}

function allowsTreeNumbers(status: ReservationStatus) {
  return status !== ReservationStatus.BOOKED
}

function allowsPaidTo(status: ReservationStatus) {
  return (
    status === ReservationStatus.CUT ||
    status === ReservationStatus.PICKED_UP
  )
}

// Admin quick-create allows minimal input and auto-fills DB-required fields.
export async function createAdminQuickReservation(
  data: CreateAdminQuickReservationData,
  year: number,
): Promise<{ success: boolean; data?: Reservation; error?: string }> {
  if (!Number.isInteger(data.treeCount) || data.treeCount < 1 || data.treeCount > 20) {
    return { success: false, error: "Fak szama 1 es 20 kozott lehet." }
  }

  const status = data.status ?? ReservationStatus.BOOKED
  const normalizedTreeNumbersRaw = data.treeNumbers?.trim() ?? ""
  const treeNumbers = requiresTreeNumber(status)
    ? normalizedTreeNumbersRaw || "0"
    : normalizedTreeNumbersRaw || undefined
  const paidTo = data.paidTo || undefined

  if (!allowsTreeNumbers(status) && treeNumbers && treeNumbers.trim() !== "") {
    return {
      success: false,
      error: "Ennel a statusznal nem lehet fa sorszam. Torold a sorszamot, vagy valassz masik statuszt.",
    }
  }
  if (!allowsPaidTo(status) && paidTo) {
    return {
      success: false,
      error: "Ennel a statusznal nem rogzitheto fizetes. Torold a fizetest, vagy valassz masik statuszt.",
    }
  }

  const parsedTreeNumbers = (treeNumbers || "")
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0)

  if (parsedTreeNumbers.length > 0) {
    const { conflictingNumbers } = await findConflictingTreeNumbers(parsedTreeNumbers, year)
    if (conflictingNumbers.length > 0) {
      return {
        success: false,
        error: `A kovetkezo fa sorszamok mar foglaltak: ${conflictingNumbers.join(", ")}`,
      }
    }
  }

  const name = data.name?.trim() || makeAdminPlaceholderName()
  const phone = data.phone?.trim() || "N/A"
  const visitDate = data.visitDate?.trim() || formatTodayLocal()

  const rows = await sql`
    INSERT INTO reservations (year, name, phone, email, visit_date, pickup_date, tree_count, notes, status, tree_numbers, paid_to)
    VALUES (
      ${year},
      ${name},
      ${phone},
      ${data.email?.trim() || null},
      ${visitDate},
      ${data.pickupDate?.trim() || null},
      ${data.treeCount},
      ${data.notes?.trim() || null},
      ${status},
      ${treeNumbers || null},
      ${paidTo || null}
    )
    RETURNING *
  `
  const created = rowToReservation(rows[0])
  if (data.photos && data.photos.length > 0) {
    for (const photo of data.photos) {
      await sql`
        INSERT INTO reservation_photos (reservation_id, photo_url, photo_public_id)
        VALUES (${created.id}, ${photo.photoUrl}, ${photo.photoPublicId})
      `
    }
  }
  const reloaded = await getReservationById(created.id)
  return { success: true, data: reloaded ?? created }
}

// Update reservation
export async function updateReservation(
  id: number,
  data: UpdateReservationData,
): Promise<{ success: boolean; data?: Reservation; error?: string }> {
  // First check if reservation exists
  const existing = await getReservationById(id)
  if (!existing) {
    return { success: false, error: "Foglalás nem található" }
  }

  // Validate if core fields are being updated
  if (data.name !== undefined || data.phone !== undefined || data.treeCount !== undefined) {
    const errors = validateReservationData({
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      visitDate: data.visitDate ?? existing.visitDate,
      treeCount: data.treeCount ?? existing.treeCount,
    })
    if (errors.length > 0) {
      return { success: false, error: errors[0] }
    }
  }

  // Determine final values for status-based field gating
  const finalStatus = data.status ?? existing.status
  const finalTreeNumbers = data.treeNumbers !== undefined ? data.treeNumbers : existing.treeNumbers
  const finalPaidTo = data.paidTo !== undefined ? data.paidTo : existing.paidTo

  if (requiresTreeNumber(finalStatus) && (!finalTreeNumbers || finalTreeNumbers.trim() === "")) {
    return { success: false, error: "A fa sorszáma kötelező ennél a státusznál és nem lehet üres." }
  }
  if (!allowsTreeNumbers(finalStatus) && finalTreeNumbers && finalTreeNumbers.trim() !== "") {
    return {
      success: false,
      error: "Ennél a státusznál nem lehet fa sorszám. Töröld a sorszámot, vagy válassz másik státuszt.",
    }
  }
  if (!allowsPaidTo(finalStatus) && finalPaidTo) {
    return {
      success: false,
      error: "Ennél a státusznál nem rögzíthető fizetés. Töröld a fizetést, vagy válassz másik státuszt.",
    }
  }

  // Build update query dynamically
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`)
    values.push(data.phone)
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramIndex++}`)
    values.push(data.email || null)
  }
  if (data.visitDate !== undefined) {
    updates.push(`visit_date = $${paramIndex++}`)
    values.push(data.visitDate)
  }
  if (data.pickupDate !== undefined) {
    updates.push(`pickup_date = $${paramIndex++}`)
    values.push(data.pickupDate || null)
  }
  if (data.treeCount !== undefined) {
    updates.push(`tree_count = $${paramIndex++}`)
    values.push(data.treeCount)
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`)
    values.push(data.notes || null)
  }
  if (data.treeNumbers !== undefined) {
    updates.push(`tree_numbers = $${paramIndex++}`)
    values.push(data.treeNumbers || null)
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }
  if (data.paidTo !== undefined) {
    updates.push(`paid_to = $${paramIndex++}`)
    values.push(data.paidTo || null)
  }

  if (updates.length === 0) {
    return { success: true, data: existing }
  }

  values.push(id)
  const query = `UPDATE reservations SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`

  const rows = await sql.query(query, values)
  const reloaded = await getReservationById(id)
  return { success: true, data: reloaded ?? rowToReservation(rows[0]) }
}

export async function addReservationPhoto(
  reservationId: number,
  photo: { photoUrl: string; photoPublicId: string },
): Promise<{ success: boolean; data?: ReservationPhoto; error?: string }> {
  const existing = await getReservationById(reservationId)
  if (!existing) return { success: false, error: "Foglalás nem található" }
  const rows = await sql`
    INSERT INTO reservation_photos (reservation_id, photo_url, photo_public_id)
    VALUES (${reservationId}, ${photo.photoUrl}, ${photo.photoPublicId})
    RETURNING id, reservation_id, photo_url, photo_public_id, created_at
  `
  return { success: true, data: rowToReservationPhoto(rows[0]) }
}

export async function getReservationPhotoById(
  reservationId: number,
  photoId: number,
): Promise<ReservationPhoto | null> {
  const rows = await sql`
    SELECT id, reservation_id, photo_url, photo_public_id, created_at
    FROM reservation_photos
    WHERE id = ${photoId} AND reservation_id = ${reservationId}
  `
  if (rows.length === 0) return null
  return rowToReservationPhoto(rows[0])
}

export async function deleteReservationPhoto(
  reservationId: number,
  photoId: number,
): Promise<{ success: boolean; error?: string }> {
  const existing = await getReservationPhotoById(reservationId, photoId)
  if (!existing) return { success: false, error: "Fotó nem található" }
  await sql`DELETE FROM reservation_photos WHERE id = ${photoId} AND reservation_id = ${reservationId}`
  return { success: true }
}

// Delete reservation
export async function deleteReservation(id: number): Promise<{ success: boolean; error?: string }> {
  const existing = await getReservationById(id)
  if (!existing) {
    return { success: false, error: "Foglalás nem található" }
  }
  await sql`DELETE FROM reservations WHERE id = ${id}`
  return { success: true }
}

// Check for conflicting tree numbers within the same year. The same physical tree number
// can be reused across years, since the tagged trees are different each season.
export async function findConflictingTreeNumbers(
  treeNumbers: number[],
  year: number,
  excludeReservationId?: number,
): Promise<{ conflictingNumbers: number[]; reservationNames: Map<number, string> }> {
  if (treeNumbers.length === 0) {
    return { conflictingNumbers: [], reservationNames: new Map() }
  }

  let query =
    "SELECT id, name, tree_numbers FROM reservations WHERE year = $1 AND tree_numbers IS NOT NULL AND tree_numbers != ''"
  const params: any[] = [year]

  if (excludeReservationId) {
    params.push(excludeReservationId)
    query += ` AND id != $${params.length}`
  }

  const rows = await sql.query(query, params)

  const conflictingNumbers: number[] = []
  const reservationNames = new Map<number, string>()

  for (const row of rows) {
    const existingNumbers = (row.tree_numbers as string)
      .split(",")
      .map((s: string) => Number.parseInt(s.trim(), 10))
      .filter((n: number) => !Number.isNaN(n) && n > 0)

    for (const num of treeNumbers) {
      if (existingNumbers.includes(num) && !conflictingNumbers.includes(num)) {
        conflictingNumbers.push(num)
        reservationNames.set(num, row.name as string)
      }
    }
  }

  return { conflictingNumbers, reservationNames }
}

// Get stats for a single year. Revenue uses the price stored on that year's settings row.
export async function getReservationStats(year: number): Promise<{
  totalReservations: number
  totalTrees: number
  upcomingWeekend: number
  revenueJanos: number
  revenueSanyi: number
  totalRevenue: number
}> {
  const totalsRows = await sql`
    SELECT
      COUNT(*) AS total_reservations,
      COALESCE(SUM(tree_count), 0) AS total_trees
    FROM reservations
    WHERE year = ${year}
  `

  const today = new Date().toISOString().split("T")[0]
  const upcomingRows = await sql`
    SELECT COUNT(*) AS upcoming_weekend
    FROM reservations
    WHERE year = ${year}
      AND visit_date >= ${today}
      AND EXTRACT(DOW FROM visit_date) IN (0, 6)
  `

  const revenueRows = await sql`
    SELECT
      paid_to,
      SUM(tree_count) AS total_trees
    FROM reservations
    WHERE year = ${year}
      AND paid_to IS NOT NULL
    GROUP BY paid_to
  `

  const settingsRows = await sql`SELECT price FROM settings WHERE year = ${year}`
  const price = settingsRows[0]?.price ? Number(settingsRows[0].price) : 8000

  let revenueJanos = 0
  let revenueSanyi = 0

  for (const row of revenueRows) {
    const revenue = Number(row.total_trees) * price
    if (row.paid_to === "János") {
      revenueJanos = revenue
    } else if (row.paid_to === "Sanyi") {
      revenueSanyi = revenue
    }
  }

  return {
    totalReservations: Number(totalsRows[0].total_reservations),
    totalTrees: Number(totalsRows[0].total_trees),
    upcomingWeekend: Number(upcomingRows[0].upcoming_weekend),
    revenueJanos,
    revenueSanyi,
    totalRevenue: revenueJanos + revenueSanyi,
  }
}
