import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { validateSession } from "@/lib/auth"
import { getSettings } from "@/lib/settings"
import { getViewYear } from "@/lib/years"
import { getTotalTreesReservedForYear } from "@/lib/reservations"
import SettingsClient from "@/components/settings-client"

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("admin_session")?.value

  if (!sessionId || !(await validateSession(sessionId))) {
    redirect("/admin-login")
  }

  const year = await getViewYear()
  const [settings, totalTreesReserved] = await Promise.all([
    getSettings(year),
    getTotalTreesReservedForYear(year),
  ])

  return <SettingsClient initialSettings={settings} year={year} initialTreesReserved={totalTreesReserved} />
}
