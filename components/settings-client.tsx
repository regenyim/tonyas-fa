"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Save, X } from "lucide-react"
import type { Settings } from "@/lib/types"
import { useUnsavedChanges } from "@/contexts/unsaved-changes-context"

interface Props {
  initialSettings: Settings
  year: number
  initialTreesReserved: number
}

const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all duration-150"
const labelClass = "block text-xs font-bold text-foreground tracking-widest uppercase mb-2"

const monthNames = ["január","február","március","április","május","június","július","augusztus","szeptember","október","november","december"]
// Monday-first
const dayNames = ["H","K","Sze","Cs","P","Szo","V"]

export default function SettingsClient({ initialSettings, year, initialTreesReserved }: Props) {
  const alertRef = useRef<HTMLDivElement>(null)
  const { setDirty } = useUnsavedChanges()
  const [treesReserved, setTreesReserved] = useState(initialTreesReserved)

  useEffect(() => {
    setTreesReserved(initialTreesReserved)
  }, [initialTreesReserved])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/stats/trees")
        const data = await res.json()
        if (data.success) setTreesReserved(data.totalTreesReserved)
      } catch {}
    }, 30_000)
    return () => clearInterval(interval)
  }, [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [savedSummary, setSavedSummary] = useState<string[]>([])
  const lastSavedRef = useRef({
    availableDays: [...(initialSettings.availableDays || [])].sort(),
    maxBookingsPerDay: initialSettings.maxBookingsPerDay,
    maxTreesPerSeason: initialSettings.maxTreesPerSeason,
    retrievalDays: [...(initialSettings.retrievalDays || [])].sort(),
    pricePerTree: initialSettings.pricePerTree,
  })

  useEffect(() => {
    if (error || success) {
      setTimeout(() => alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
    }
  }, [error, success])
  const [formData, setFormData] = useState<{
    availableDays: string[]
    maxBookingsPerDay: number | ""
    maxTreesPerSeason: number | ""
    retrievalDays: string[]
    pricePerTree: number | ""
  }>({
    availableDays: initialSettings.availableDays || [],
    maxBookingsPerDay: initialSettings.maxBookingsPerDay,
    maxTreesPerSeason: initialSettings.maxTreesPerSeason,
    retrievalDays: initialSettings.retrievalDays || [],
    pricePerTree: initialSettings.pricePerTree,
  })

  // Re-sync form when the parent re-renders for a different year
  useEffect(() => {
    setFormData({
      availableDays: initialSettings.availableDays || [],
      maxBookingsPerDay: initialSettings.maxBookingsPerDay,
      maxTreesPerSeason: initialSettings.maxTreesPerSeason,
      retrievalDays: initialSettings.retrievalDays || [],
      pricePerTree: initialSettings.pricePerTree,
    })
  }, [initialSettings])

  const normalizedInitial = useMemo(
    () => ({
      availableDays: [...(initialSettings.availableDays || [])].sort(),
      maxBookingsPerDay: initialSettings.maxBookingsPerDay,
      maxTreesPerSeason: initialSettings.maxTreesPerSeason,
      retrievalDays: [...(initialSettings.retrievalDays || [])].sort(),
      pricePerTree: initialSettings.pricePerTree,
    }),
    [initialSettings],
  )

  const normalizedForm = useMemo(
    () => ({
      availableDays: [...formData.availableDays].sort(),
      maxBookingsPerDay: formData.maxBookingsPerDay,
      maxTreesPerSeason: formData.maxTreesPerSeason,
      retrievalDays: [...formData.retrievalDays].sort(),
      pricePerTree: formData.pricePerTree,
    }),
    [formData],
  )

  useEffect(() => {
    const dirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedInitial)
    setDirty(dirty)
  }, [normalizedForm, normalizedInitial, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  const firstDateMonth = (dates: string[]) => {
    if (dates.length > 0) {
      const [year, month] = dates.slice().sort()[0].split("-")
      return new Date(Number(year), Number(month) - 1, 1)
    }
    return new Date(new Date().getFullYear(), 11, 1)
  }

  const [availableMonth, setAvailableMonth] = useState(() => firstDateMonth(initialSettings.availableDays || []))
  const [retrievalMonth, setRetrievalMonth] = useState(() => firstDateMonth(initialSettings.retrievalDays || []))

  const toDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const buildWeeks = (monthDate: Date) => {
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
    const firstDayRaw = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay()
    const firstDay = (firstDayRaw + 6) % 7 // Monday-based
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    const weeks: (number | null)[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return weeks
  }

  const toggleDay = (key: "availableDays" | "retrievalDays", dateStr: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(dateStr)
        ? prev[key].filter((d) => d !== dateStr)
        : [...prev[key], dateStr],
    }))
  }

  const computeChangeSummary = (
    before: typeof lastSavedRef.current,
    after: { availableDays: string[]; maxBookingsPerDay: number | ""; maxTreesPerSeason: number | ""; retrievalDays: string[]; pricePerTree: number | "" },
  ): string[] => {
    const changes: string[] = []
    if (before.maxBookingsPerDay !== after.maxBookingsPerDay) {
      changes.push(`Max. fa/rendelés: ${before.maxBookingsPerDay} → ${after.maxBookingsPerDay}`)
    }
    if (before.maxTreesPerSeason !== after.maxTreesPerSeason) {
      changes.push(`Max. fa/szezon: ${before.maxTreesPerSeason} → ${after.maxTreesPerSeason}`)
    }
    if (before.pricePerTree !== after.pricePerTree) {
      changes.push(`Ár fánként: ${Number(before.pricePerTree).toLocaleString("hu-HU")} Ft → ${Number(after.pricePerTree).toLocaleString("hu-HU")} Ft`)
    }
    const afterAvailSorted = [...after.availableDays].sort()
    const afterRetrSorted = [...after.retrievalDays].sort()
    if (JSON.stringify(before.availableDays) !== JSON.stringify(afterAvailSorted)) {
      changes.push(`Foglalható napok: ${before.availableDays.length} nap → ${afterAvailSorted.length} nap`)
    }
    if (JSON.stringify(before.retrievalDays) !== JSON.stringify(afterRetrSorted)) {
      changes.push(`Átvételi napok: ${before.retrievalDays.length} nap → ${afterRetrSorted.length} nap`)
    }
    return changes
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    setSavedSummary([])
    if (formData.maxBookingsPerDay === "") {
      setError("A maximum fa rendelésenként mező nem lehet üres.")
      return
    }
    if (formData.maxTreesPerSeason === "") {
      setError("A maximális fa/szezon mező nem lehet üres.")
      return
    }
    if (formData.pricePerTree === "") {
      setError("Az ár fánként mező nem lehet üres.")
      return
    }
    if (typeof formData.maxTreesPerSeason === "number" && formData.maxTreesPerSeason < treesReserved) {
      setError(`A szezonális limit nem lehet kevesebb, mint a már megrendelt fák száma (${treesReserved} db).`)
      return
    }
    setIsSaving(true)
    try {
      const summary = computeChangeSummary(lastSavedRef.current, formData)
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setDirty(false)
        setSuccess("A beállítások mentése sikerült.")
        setSavedSummary(summary)
        lastSavedRef.current = {
          availableDays: [...formData.availableDays].sort(),
          maxBookingsPerDay: formData.maxBookingsPerDay,
          maxTreesPerSeason: formData.maxTreesPerSeason,
          retrievalDays: [...formData.retrievalDays].sort(),
          pricePerTree: formData.pricePerTree,
        }
      } else {
        setError(data.error || "A mentés nem sikerült.")
      }
    } catch {
      setError("Hálózati hiba történt.")
    } finally {
      setIsSaving(false)
    }
  }

  const CalendarBlock = ({
    title,
    subtitle,
    month,
    onMonthChange,
    dates,
    dayKey,
    activeClass,
  }: {
    title: string
    subtitle: string
    month: Date
    onMonthChange: (date: Date) => void
    dates: string[]
    dayKey: "availableDays" | "retrievalDays"
    activeClass: string
  }) => (
    <div className="border border-border bg-surface rounded-lg p-6">
      <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-1">{title}</p>
      <p className="text-sm text-primary font-light mb-5">{subtitle}</p>

      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 rounded-lg border border-border hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
          <ChevronLeft className="h-4 w-4 text-primary" />
        </button>
        <p className="text-xs font-bold text-foreground tracking-widest uppercase">
          {month.getFullYear()}. {monthNames[month.getMonth()]}
        </p>
        <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 rounded-lg border border-border hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-primary/40 tracking-widest uppercase mb-2">
        {dayNames.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="space-y-1">
        {buildWeeks(month).map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={`${wi}-${di}`} className="h-10" />
              const dateStr = toDateStr(month.getFullYear(), month.getMonth(), day)
              const active = dates.includes(dateStr)
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => toggleDay(dayKey, dateStr)}
                  className={`h-10 rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${active ? activeClass : "text-primary/50 hover:bg-primary/8"}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-8 pb-28">

      {/* Header */}
      <section className="text-center">
        <div className="section-label justify-center">Beállítások · {year}</div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Szezon beállításai</h1>
        <p className="text-primary font-light">Foglalási szabályok és elérhető napok kezelése.</p>
      </section>

      {/* Alerts */}
      <div ref={alertRef}>
        {error && (
          <div className="flex gap-3 p-4 border border-destructive/30 bg-destructive/8 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />{error}
          </div>
        )}
        {success && (
          <div className="flex gap-3 p-4 border border-accent/30 bg-accent/8 rounded-lg text-sm text-accent">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{success}</p>
              {savedSummary.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {savedSummary.map((line) => (
                    <li key={line} className="text-accent/80 font-light">— {line}</li>
                  ))}
                </ul>
              )}
              {savedSummary.length === 0 && (
                <p className="mt-0.5 text-accent/70 font-light">Nem változott egyetlen beállítás sem.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSuccess(""); setSavedSummary([]) }}
              className="flex-shrink-0 text-accent/50 hover:text-accent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              aria-label="Bezárás"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        {/* Left — numeric settings + season capacity */}
        <div className="space-y-6">
          <div className="border border-border bg-surface rounded-lg p-6 space-y-5">
            <p className="text-xs font-bold text-foreground tracking-widest uppercase">Általános</p>
            <div>
              <label className={labelClass}>Maximum fa rendelésenként</label>
              <input type="number" min="1" value={formData.maxBookingsPerDay} onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: e.target.value === "" ? "" : Number.parseInt(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Maximális fa szezononként</label>
              <input type="number" min="1" value={formData.maxTreesPerSeason} onChange={(e) => setFormData({ ...formData, maxTreesPerSeason: e.target.value === "" ? "" : Number.parseInt(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ár fánként (Ft)</label>
              <input type="number" min="1" value={formData.pricePerTree} onChange={(e) => setFormData({ ...formData, pricePerTree: e.target.value === "" ? "" : Number.parseInt(e.target.value) })} className={inputClass} />
            </div>
          </div>

          {/* Season tree capacity — first on mobile */}
          {(() => {
            const limit = typeof formData.maxTreesPerSeason === "number" ? formData.maxTreesPerSeason : 0
            const remaining = Math.max(0, limit - treesReserved)
            const pct = limit > 0 ? Math.min(100, Math.round((treesReserved / limit) * 100)) : 0
            return (
              <div className="border border-border bg-surface rounded-lg p-6">
                <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-4">Szezonális fa kapacitás</p>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-xs font-bold text-accent tracking-widest uppercase">Megrendelt fák</span>
                    <span className="text-sm font-bold text-foreground">{treesReserved} db</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-xs font-bold text-accent tracking-widest uppercase">Szabad kapacitás</span>
                    <span className={`text-sm font-bold ${remaining === 0 ? "text-destructive" : "text-foreground"}`}>{remaining} db</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-xs font-bold text-accent tracking-widest uppercase">Kihasználtság</span>
                    <span className="text-sm font-bold text-foreground">{pct}%</span>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? "bg-destructive" : "bg-accent"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}

          {/* Calendar summary */}
          <div className="border border-border bg-surface rounded-lg p-6">
            <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-4">Naptár összesítő</p>
            <div className="space-y-0">
              {[
                { label: "Elérhető napok", value: formData.availableDays.length },
                { label: "Átvételi napok", value: formData.retrievalDays.length },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-3 border-b border-border last:border-b-0">
                  <span className="text-xs font-bold text-accent tracking-widest uppercase">{row.label}</span>
                  <span className="text-sm font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — calendars */}
        <div className="space-y-6">
          <CalendarBlock
            title="Foglalható napok"
            subtitle="Ezek a napok jelennek meg a publikus foglalási naptárban."
            month={availableMonth}
            onMonthChange={setAvailableMonth}
            dates={formData.availableDays}
            dayKey="availableDays"
            activeClass="bg-foreground text-background font-semibold"
          />
          <CalendarBlock
            title="Átvételi napok"
            subtitle="Ezek a napok választhatók a későbbi átvételhez."
            month={retrievalMonth}
            onMonthChange={setRetrievalMonth}
            dates={formData.retrievalDays}
            dayKey="retrievalDays"
            activeClass="bg-foreground text-background font-semibold"
          />
        </div>
      </div>

      {/* Save bar */}
      <div className="border-t border-border pt-6">
        <button type="button" onClick={handleSave} disabled={isSaving} className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
          <Save className="h-4 w-4" />
          {isSaving ? "Mentés..." : "Beállítások mentése"}
        </button>
      </div>

    </div>
  )
}
