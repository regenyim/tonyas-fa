"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNavigation } from "@/lib/site"
import type { Year } from "@/lib/types"
import { YearsManagerDialog } from "@/components/years-manager-dialog"
import { useUnsavedChanges } from "@/contexts/unsaved-changes-context"

interface AdminShellNavProps {
  years: Year[]
  viewYear: number
  activeYear: number | null
}

export function AdminShellNav({ years, viewYear, activeYear }: AdminShellNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [managerOpen, setManagerOpen] = useState(false)
  const { isDirty, navigate } = useUnsavedChanges()
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75)
    vv.addEventListener("resize", handleResize)
    return () => vv.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const guardedClick = (e: React.MouseEvent, href: string) => {
    if (isDirty) {
      e.preventDefault()
      navigate(href)
    }
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === href
    return pathname.startsWith(href)
  }
  const showQuickReservation = ["/admin", "/admin/reservations", "/admin/expenses", "/admin/settings"].some((href) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href),
  )

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/admin-login"
  }

  const handleYearChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number.parseInt(event.target.value, 10)
    if (!Number.isInteger(next) || next === viewYear) return
    const response = await fetch("/api/admin/view-year", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year: next }),
    })
    if (response.ok) {
      startTransition(() => router.refresh())
    }
  }

  const yearLabel = (year: Year) => (year.year === activeYear ? `${year.year} (aktív)` : String(year.year))

  // Ensure the current view year shows up even if it's somehow missing from the years list
  // (shouldn't happen post-migration, but the cookie can outlive a deletion).
  const yearOptions = years.some((y) => y.year === viewYear)
    ? years
    : [{ year: viewYear, isActive: viewYear === activeYear, createdAt: "" }, ...years]

  const yearControls = (
    <div className="flex items-center gap-1.5">
      {isMounted ? (
        <select
          value={viewYear}
          onChange={handleYearChange}
          disabled={isPending}
          aria-label="Megjelenített év"
          className="h-8 rounded-lg border border-border bg-white px-2 pr-11 text-sm font-medium text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
        >
          {yearOptions.map((y) => (
            <option key={y.year} value={y.year}>
              {yearLabel(y)}
            </option>
          ))}
        </select>
      ) : (
        <div aria-hidden="true" className="h-8 w-[132px] rounded-lg border border-border bg-white/70" />
      )}
      <button
        type="button"
        onClick={() => setManagerOpen(true)}
        aria-label="Évek kezelése"
        title="Évek kezelése"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-primary hover:bg-primary/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <>
      <header className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-accent">Admin</span>
            {yearControls}
            <div className="hidden md:flex items-center gap-1 ml-4">
              {adminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => guardedClick(e, item.href)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive(item.href)
                      ? "bg-primary text-background"
                      : "text-primary/60 hover:text-primary hover:bg-primary/8",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showQuickReservation && (
              <Link
                href="/admin/reservations/quick"
                onClick={(e) => guardedClick(e, "/admin/reservations/quick")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground sm:px-3 sm:py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gyors foglalás</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-primary/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Kijelentkezés</span>
            </button>
          </div>
        </div>
      </header>

      <nav className={cn("fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/98 px-3 py-2 backdrop-blur-md md:hidden", keyboardOpen && "hidden")}>
        <div className="grid grid-cols-4 gap-2">
          {adminNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => guardedClick(e, item.href)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-xl text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive(item.href) ? "bg-primary text-background" : "text-primary/60 hover:bg-primary/8 hover:text-primary",
              )}
            >
              <item.icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <YearsManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        viewYear={viewYear}
        activeYear={activeYear}
      />
    </>
  )
}
