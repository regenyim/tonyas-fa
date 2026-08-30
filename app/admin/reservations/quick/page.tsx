import { cookies } from "next/headers"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import QuickReservationForm from "@/components/quick-reservation-form"
import { getSessionUser } from "@/lib/auth"
import { paidToForUsername } from "@/lib/admin-users"

export default async function QuickReservationPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("admin_session")?.value
  const currentAdminPaidTo = paidToForUsername(sessionId ? await getSessionUser(sessionId) : null)

  return (
    <div className="space-y-8 pb-24">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-2 text-sm text-[#4a4f4a]/60 hover:text-[#4a4f4a] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Vissza a foglalásokhoz
      </Link>

      <section>
        <p className="section-kicker">Gyors foglalás</p>
        <h1 className="admin-section-title">Új admin foglalás rögzítése</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/70">
          Csak a fák száma kötelező. Ha a többi mezőt üresen hagyod, a rendszer automatikus helyőrző értékekkel menti.
        </p>
      </section>

      <QuickReservationForm currentAdminPaidTo={currentAdminPaidTo} />
    </div>
  )
}
