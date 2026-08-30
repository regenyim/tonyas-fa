"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, Trash2, X, Zap, CalendarRange } from "lucide-react"
import type { YearWithCounts } from "@/lib/types"

interface YearsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewYear: number
  activeYear: number | null
}

export function YearsManagerDialog({ open, onOpenChange, activeYear }: YearsManagerDialogProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [years, setYears] = useState<YearWithCounts[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyYear, setBusyYear] = useState<number | null>(null)
  const [confirmActivateYear, setConfirmActivateYear] = useState<number | null>(null)
  const [newYear, setNewYear] = useState<string>("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open) { setConfirmActivateYear(null); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch("/api/admin/years")
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        if (body.success) {
          setYears(body.years as YearWithCounts[])
          const max = body.years.length > 0 ? Math.max(...body.years.map((y: YearWithCounts) => y.year)) : new Date().getFullYear()
          setNewYear(String(max + 1))
        } else {
          setError(body.error ?? "Nem sikerült betölteni az éveket")
        }
      })
      .catch(() => {
        if (!cancelled) setError("Hálózati hiba")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const refresh = async () => {
    const body = await fetch("/api/admin/years").then((r) => r.json())
    if (body.success) setYears(body.years as YearWithCounts[])
    startTransition(() => router.refresh())
  }

  const handleActivate = async (year: number) => {
    setBusyYear(year)
    setError(null)
    const response = await fetch(`/api/admin/years/${year}/activate`, { method: "POST" })
    const body = await response.json()
    if (!body.success) setError(body.error ?? "Aktiválás sikertelen")
    else await refresh()
    setBusyYear(null)
  }

  const handleDelete = async (year: number) => {
    if (!confirm(`Biztosan törlöd a(z) ${year}-os évet?`)) return
    setBusyYear(year)
    setError(null)
    const response = await fetch(`/api/admin/years/${year}`, { method: "DELETE" })
    const body = await response.json()
    if (!body.success) setError(body.error ?? "Törlés sikertelen")
    else await refresh()
    setBusyYear(null)
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = Number.parseInt(newYear, 10)
    if (!Number.isInteger(parsed)) {
      setError("Érvénytelen év")
      return
    }
    setCreating(true)
    setError(null)
    const response = await fetch("/api/admin/years", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year: parsed }),
    })
    const body = await response.json()
    if (!body.success) setError(body.error ?? "Létrehozás sikertelen")
    else {
      setNewYear(String(parsed + 1))
      await refresh()
    }
    setCreating(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#f8f7f5] shadow-2xl ring-1 ring-[#bfc3c7]/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4a4f4a]/8">
                <CalendarRange className="h-4.5 w-4.5 text-[#4a4f4a]" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold leading-tight text-[#3a3a3a]">
                  Évek kezelése
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs text-[#4a4f4a]/55">
                  Az aktív év jelenik meg a foglalási oldalon
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[#4a4f4a]/40 transition-colors duration-150 hover:bg-[#4a4f4a]/8 hover:text-[#4a4f4a] cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#bfc3c7]/50" />

          {/* Create new year form */}
          <div className="px-6 py-4">
            <form onSubmit={handleCreate} className="flex items-center gap-2.5">
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                min={2000}
                max={3000}
                className="h-9 w-24 rounded-lg border border-[#bfc3c7] bg-white px-3 text-sm font-semibold tabular-nums text-[#3a3a3a] shadow-sm transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e7f6a]/40 focus-visible:border-[#6e7f6a]"
              />
              <button
                type="submit"
                disabled={creating}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#4a4f4a] px-3.5 text-sm font-medium text-[#ededed] shadow-sm transition-all duration-150 hover:bg-[#3a3a3a] active:scale-[0.97] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                Új év
              </button>
              <p className="text-[11px] leading-snug text-[#4a4f4a]/50">
                Beállítások klónozva,<br/>kivéve a foglalható napokat
              </p>
            </form>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[--rose-border] bg-[--rose-soft] px-3 py-2.5">
                <span className="mt-px text-sm leading-tight text-[--rose-strong]">{error}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#bfc3c7]/50" />

          {/* Years list */}
          <div className="max-h-[320px] overflow-y-auto">
            {loading && (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-[#4a4f4a]/6" />
                ))}
              </div>
            )}

            {!loading && years && years.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
                <CalendarRange className="h-8 w-8 text-[#4a4f4a]/20" />
                <p className="text-sm font-medium text-[#4a4f4a]/40">Még nincs egyetlen év sem</p>
              </div>
            )}

            {!loading && years?.map((y, idx) => {
              const isActive = activeYear === y.year
              const isBusy = busyYear === y.year
              const hasData = y.reservationCount > 0 || y.expenseCount > 0
              const deleteDisabled = isActive || hasData || isBusy
              const deleteTitle = isActive
                ? "Aktív évet nem lehet törölni"
                : hasData
                ? `${y.reservationCount} foglalás és ${y.expenseCount} kiadás tartozik ehhez az évhez`
                : "Év törlése"

              const isConfirming = confirmActivateYear === y.year

              return (
                <div
                  key={y.year}
                  className={[
                    "flex flex-col transition-colors duration-150",
                    idx < (years?.length ?? 0) - 1 ? "border-b border-[#bfc3c7]/40" : "",
                    isActive ? "bg-[#6e7f6a]/8" : isConfirming ? "bg-amber-50/60" : "hover:bg-[#4a4f4a]/3",
                  ].join(" ")}
                >
                  {/* Main row */}
                  <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={[
                          "text-base font-bold tabular-nums",
                          isActive ? "text-[#2d5430]" : "text-[#3a3a3a]",
                        ].join(" ")}>
                          {y.year}
                        </span>

                        {isActive && (
                          <span className="shrink-0 rounded-md border border-[#6e7f6a]/30 bg-[#6e7f6a]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#2d5430]">
                            aktív
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#4a4f4a]/50">
                        {y.reservationCount > 0 ? (
                          <span className="font-medium text-[#4a4f4a]/70">{y.reservationCount} foglalás</span>
                        ) : (
                          <span>0 foglalás</span>
                        )}
                        <span>·</span>
                        <span>{y.expenseCount} kiadás</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {!isConfirming && (
                        <button
                          type="button"
                          onClick={() => isActive ? undefined : setConfirmActivateYear(y.year)}
                          disabled={isActive || isBusy}
                          title={isActive ? "Már aktív" : "Aktiválás"}
                          className={[
                            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                            isActive
                              ? "border-[#6e7f6a]/30 bg-[#6e7f6a]/10 text-[#2d5430] opacity-60 cursor-not-allowed"
                              : "border-[#bfc3c7] bg-white text-[#4a4f4a] shadow-sm hover:border-[#6e7f6a]/60 hover:bg-[#6e7f6a]/8 hover:text-[#2d5430] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed",
                          ].join(" ")}
                        >
                          <Zap className={["h-3 w-3", isBusy ? "animate-pulse" : ""].join(" ")} />
                          Aktiválás
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(y.year)}
                        disabled={deleteDisabled || isConfirming}
                        title={deleteTitle}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#bfc3c7] bg-white text-[#4a4f4a]/50 shadow-sm transition-all duration-150 hover:border-[--rose-border] hover:bg-[--rose-soft] hover:text-[--rose-strong] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                      >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                  {/* Confirmation strip — shown below the row on mobile */}
                  {isConfirming && (
                    <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                      <span className="text-xs font-medium text-amber-800">Biztosan aktiválod a(z) {y.year}-os évet?</span>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setConfirmActivateYear(null); handleActivate(y.year) }}
                          className="inline-flex h-7 items-center rounded-md border border-[#6e7f6a]/50 bg-[#6e7f6a]/15 px-3 text-xs font-semibold text-[#2d5430] transition-all duration-150 hover:bg-[#6e7f6a]/25 active:scale-[0.97] cursor-pointer"
                        >
                          Igen
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmActivateYear(null)}
                          className="inline-flex h-7 items-center rounded-md border border-[#bfc3c7] bg-white px-3 text-xs font-medium text-[#4a4f4a] shadow-sm transition-all duration-150 hover:bg-[#4a4f4a]/6 active:scale-[0.97] cursor-pointer"
                        >
                          Mégse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer padding */}
          <div className="h-2" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
