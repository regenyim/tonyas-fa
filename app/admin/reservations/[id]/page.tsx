import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionUser, validateSession } from "@/lib/auth"
import { getReservationById } from "@/lib/reservations"
import { paidToForUsername } from "@/lib/admin-users"
import ReservationDetailClient from "@/components/reservation-detail-client"

export default async function ReservationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("admin_session")?.value

  // Server-side auth check
  if (!sessionId || !(await validateSession(sessionId))) {
    redirect("/admin-login")
  }

  const [{ id }, { created }] = await Promise.all([params, searchParams])
  const reservation = await getReservationById(Number.parseInt(id))

  if (!reservation) {
    redirect("/admin/reservations")
  }

  const currentAdminPaidTo = paidToForUsername(await getSessionUser(sessionId))

  return <ReservationDetailClient reservation={reservation} currentAdminPaidTo={currentAdminPaidTo} justCreated={created === "true"} />
}
