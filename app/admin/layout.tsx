import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { validateSession } from "@/lib/auth"
import { AdminShellNav } from "@/components/admin-shell-nav"
import { getActiveYear, getViewYear, listYears } from "@/lib/years"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const adminSessionId = cookieStore.get("admin_session")?.value

  if (!adminSessionId || !(await validateSession(adminSessionId))) {
    redirect("/admin-login")
  }

  const [years, activeYear, viewYear] = await Promise.all([
    listYears(),
    getActiveYear(),
    getViewYear(),
  ])

  return (
    <div className="bg-background">
      <AdminShellNav years={years} viewYear={viewYear} activeYear={activeYear} />
      <main className="max-w-7xl mx-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 pb-16 pt-10 md:pb-6">{children}</main>
    </div>
  )
}
