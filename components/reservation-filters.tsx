"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown, Plus, CalendarDays, Image as ImageIcon } from "lucide-react"
import type { Reservation } from "@/lib/types"
import { reservationStatusMeta, formatDateHu } from "@/lib/site"

interface Props {
  reservations: Reservation[]
}

type SortField = "createdAt" | "visitDate" | "pickupDate" | "treeNumbers"

const sortFieldLabels: Record<SortField, string> = {
  createdAt: "Beérkezés szerint",
  visitDate: "Látogatás napja szerint",
  pickupDate: "Átvétel napja szerint",
  treeNumbers: "Fa sorszám szerint",
}

function toTimestamp(value: unknown) {
  if (typeof value === "string" || value instanceof Date) {
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  return 0
}

function compareField(a: Reservation, b: Reservation, field: SortField): number {
  if (field === "treeNumbers") {
    return (a.treeNumbers ?? "").localeCompare(b.treeNumbers ?? "", "hu", { numeric: true })
  }
  if (field === "pickupDate") {
    return toTimestamp(a.pickupDate) - toTimestamp(b.pickupDate)
  }
  if (field === "visitDate") {
    return toTimestamp(a.visitDate) - toTimestamp(b.visitDate)
  }
  return toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
}

export default function ReservationFilters({ reservations }: Props) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [visitDateFilter, setVisitDateFilter] = useState("")
  const [dateFocused, setDateFocused] = useState(false)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortAsc, setSortAsc] = useState(true)

  const hasActiveFilters = query.trim() !== "" || statusFilter !== "ALL" || visitDateFilter !== ""

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("ALL")
    setVisitDateFilter("")
  }

  const filteredReservations = useMemo(() => {
    return reservations
      .filter((reservation) => (statusFilter === "ALL" ? true : reservation.status === statusFilter))
      .filter((reservation) => (visitDateFilter ? reservation.visitDate === visitDateFilter : true))
      .filter((reservation) => {
        if (!query.trim()) return true
        const normalized = query.toLowerCase()
        return [reservation.name, reservation.phone, reservation.notes ?? "", reservation.treeNumbers ?? ""].some((value) => value.toLowerCase().includes(normalized))
      })
      .sort((a, b) => {
        const diff = compareField(a, b, sortField)
        const dir = sortAsc ? 1 : -1
        if (diff !== 0) return diff * dir
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
      })
  }, [query, reservations, statusFilter, visitDateFilter, sortField, sortAsc])

  return (
    <div className="space-y-4">
      <div className="border border-border bg-surface rounded-lg p-6">
        <div className="mb-4 md:hidden">
          <Link
            href="/admin/reservations/quick"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary/40 hover:bg-primary/6 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Gyors foglalás
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.7fr_1fr_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground tracking-widest uppercase"><Search className="h-4 w-4 text-accent" /> Keresés</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Név, telefonszám, megjegyzés vagy sorszám" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className="w-full min-w-0 px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all" />
          </label>

          <label className="block min-w-0">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground tracking-widest uppercase"><SlidersHorizontal className="h-4 w-4 text-accent" /> Státusz</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full min-w-0 px-4 py-3 pr-10 rounded-lg border border-border bg-white text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all">
              <option value="ALL">Minden státusz</option>
              {Object.entries(reservationStatusMeta).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground tracking-widest uppercase"><CalendarDays className="h-4 w-4 text-accent" /> Nap szerint</span>
            <div className="relative">
              <input type="date" value={visitDateFilter} onChange={(e) => setVisitDateFilter(e.target.value)} onFocus={() => setDateFocused(true)} onBlur={() => setDateFocused(false)} autoComplete="off" className={`w-full min-w-0 max-w-full px-4 py-3 rounded-lg border border-border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all appearance-none [color-scheme:light] ${!visitDateFilter && !dateFocused ? "text-transparent md:text-foreground" : "text-foreground"}`} style={{ WebkitAppearance: "none" }} />
              {!visitDateFilter && !dateFocused && (
                <span className="pointer-events-none absolute inset-0 flex items-center px-4 text-sm text-primary/40 md:hidden">
                  Válassz dátumot
                </span>
              )}
            </div>
          </label>

          <div className="block min-w-0">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground tracking-widest uppercase">
              <ArrowUpDown className="h-4 w-4 text-accent" /> Rendezés
            </span>
            <div className="flex gap-1">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="flex-1 min-w-0 px-4 py-3 pr-10 rounded-lg border border-border bg-white text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all"
              >
                {(Object.entries(sortFieldLabels) as [SortField, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortAsc((v) => !v)}
                aria-label={sortAsc ? "Növekvő sorrend" : "Csökkenő sorrend"}
                className="flex items-center justify-center px-3 py-3 rounded-lg border border-border bg-white text-primary hover:bg-muted transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {sortAsc ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-1.5 px-4 py-3 rounded-lg border border-border bg-white text-sm font-semibold text-primary hover:bg-muted transition-colors lg:w-auto lg:whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <X className="h-4 w-4 shrink-0" />
              Szűrők törlése
            </button>
          )}
        </div>
      </div>

      <div className="border border-border bg-surface rounded-lg overflow-hidden">
        {filteredReservations.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-muted-foreground text-sm mb-2">Nincs a szűrésnek megfelelő foglalás.</p>
            <p className="text-xs text-muted-foreground/70">Próbáld meg módosítani a szűrési feltételeket.</p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_56px_1fr_72px_152px_28px] items-center gap-4 px-6 py-2.5 bg-sidebar-accent border-b border-border">
              {["Név", "Beérkezett", "Látogatás", "Átvétel", "Db", "Sorszám", "Fotó", "Státusz", ""].map((h) => (
                <span key={h} className="text-[9px] font-bold tracking-widest uppercase text-accent">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-border">
              {filteredReservations.map((reservation) => {
                const meta = reservationStatusMeta[reservation.status] ?? {
                  label: reservation.status,
                  pillClassName: "border-border bg-surface text-primary",
                }
                const createdShort = new Date(reservation.createdAt).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })
                const visitShort = new Date(reservation.visitDate).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })
                const pickupShort = reservation.pickupDate ? new Date(reservation.pickupDate).toLocaleDateString("hu-HU", { month: "short", day: "numeric" }) : "—"
                return (
                  <Link key={reservation.id} href={`/admin/reservations/${reservation.id}`} className="block hover:bg-primary/4 transition-colors">
                    {/* Mobile — Option A: label/value grid */}
                    <div className="md:hidden flex flex-col gap-4 px-6 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-foreground tracking-tight">{reservation.name}</p>
                          <p className="text-sm text-primary font-light">{reservation.phone}{reservation.email ? <><br />{reservation.email}</> : ""}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`inline-block rounded-full px-4 py-1 text-xs font-medium border ${meta.pillClassName}`}>{meta.label}</span>
                          <span className="text-xs font-semibold text-accent tracking-widest uppercase">Megnyitás →</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent whitespace-nowrap pt-px">Beérkezett</span>
                        <span className="text-sm text-foreground font-light">{formatDateHu(new Date(reservation.createdAt).toISOString().slice(0, 10))}</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent whitespace-nowrap pt-px">Látogatás</span>
                        <span className="text-sm text-foreground font-light">{formatDateHu(reservation.visitDate)}</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent whitespace-nowrap pt-px">Átvétel</span>
                        <span className="text-sm text-foreground font-light">{reservation.pickupDate ? formatDateHu(reservation.pickupDate) : "—"}</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent whitespace-nowrap pt-px">Darab</span>
                        <span className="text-sm text-foreground font-light">{reservation.treeCount} fa</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent whitespace-nowrap pt-px">Sorszám</span>
                        <span className="text-sm text-foreground font-light">{reservation.treeNumbers || "Még nincs"}</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent whitespace-nowrap pt-px">Fotó</span>
                        <span className="text-sm text-foreground font-light">{reservation.hasPhotos ? "Van" : "Nincs"}</span>
                      </div>
                    </div>
                    {/* Desktop — Option C: table row */}
                    <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_56px_1fr_72px_152px_28px] items-center gap-4 px-6 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{reservation.name}</p>
                        <p className="text-xs text-primary font-light mt-0.5">{reservation.phone}{reservation.email ? <><br />{reservation.email}</> : ""}</p>
                      </div>
                      <span className="text-sm text-primary font-light">{createdShort}</span>
                      <span className="text-sm text-primary font-light">{visitShort}</span>
                      <span className="text-sm text-primary font-light">{pickupShort}</span>
                      <span className="text-sm text-primary font-light">{reservation.treeCount} fa</span>
                      <span className="text-sm text-primary font-light">{reservation.treeNumbers || <span className="text-border">—</span>}</span>
                      <span className="text-sm text-primary font-light">{reservation.hasPhotos ? <span className="inline-flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" />Van</span> : "—"}</span>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium border whitespace-nowrap ${meta.pillClassName}`}>{meta.label}</span>
                      <span className="text-xs font-semibold text-accent tracking-widest uppercase whitespace-nowrap">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
