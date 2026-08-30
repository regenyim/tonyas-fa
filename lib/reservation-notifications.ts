import "server-only"
import { Resend } from "resend"
import { z } from "zod"
import { type Reservation } from "./types"

const emailSchema = z.string().email()

function parseRecipientEmails(raw: string | undefined): { valid: string[]; invalid: string[] } {
  if (!raw) return { valid: [], invalid: [] }

  const candidates = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  const valid: string[] = []
  const invalid: string[] = []

  for (const candidate of candidates) {
    if (emailSchema.safeParse(candidate).success) {
      valid.push(candidate)
    } else {
      invalid.push(candidate)
    }
  }

  return { valid, invalid }
}

export async function sendNewReservationNotification(reservation: Reservation): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESERVATION_EMAIL_FROM
  const { valid: recipients, invalid } = parseRecipientEmails(process.env.RESERVATION_NOTIFY_TO)

  if (invalid.length > 0) {
    console.warn("[email] Skipping invalid reservation notification recipients:", invalid.join(", "))
  }

  if (recipients.length === 0) {
    console.warn("[email] Skipping reservation notification: RESERVATION_NOTIFY_TO is empty or invalid")
    return
  }

  if (!apiKey) {
    console.warn("[email] Skipping reservation notification: RESEND_API_KEY is missing")
    return
  }

  if (!from) {
    console.warn("[email] Skipping reservation notification: RESERVATION_EMAIL_FROM is missing")
    return
  }

  const resend = new Resend(apiKey)

  const subject = `Uj foglalas #${reservation.id} - ${reservation.name} (${reservation.visitDate})`
  const lines = [
    "Uj foglalas erkezett:",
    "",
    `ID: ${reservation.id}`,
    `Nev: ${reservation.name}`,
    `Telefon: ${reservation.phone}`,
    `Email: ${reservation.email || "-"}`,
    `Erkezes napja: ${reservation.visitDate}`,
    `Elvitel napja: ${reservation.pickupDate || "-"}`,
    `Fak szama: ${reservation.treeCount}`,
    `Megjegyzes: ${reservation.notes || "-"}`,
    `Statusz: ${reservation.status}`,
    `Letrehozva: ${reservation.createdAt}`,
  ]

  try {
    await resend.emails.send({
      from,
      to: recipients,
      subject,
      text: lines.join("\n"),
      replyTo: reservation.email ? [reservation.email] : undefined,
    })
  } catch (error) {
    console.error("[email] Reservation notification send threw:", error)
  }
}
