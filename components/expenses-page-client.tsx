"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AlertCircle, Plus, Trash2 } from "lucide-react"
import type { Expense } from "@/lib/types"

const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all duration-150"
const labelClass = "block text-xs font-bold text-foreground tracking-widest uppercase mb-2"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })
}

interface ExpensesPageClientProps {
  year: number
  initialExpenses: Expense[]
}

export default function ExpensesPageClient({ year, initialExpenses }: ExpensesPageClientProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    person: "János" as "János" | "Sanyi",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  // Sync when the parent re-renders with a different year (router.refresh after view-year change).
  useEffect(() => {
    setExpenses(initialExpenses)
  }, [initialExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      setError("Adj meg egy érvényes összeget.")
      return
    }
    try {
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, amount: Number.parseFloat(formData.amount) }),
      })
      const data = await response.json()
      if (data.success) {
        setExpenses([data.expense, ...expenses])
        setFormData({ person: "János", amount: "", description: "", date: new Date().toISOString().split("T")[0] })
        setShowForm(false)
      } else {
        setError(data.error || "A mentés nem sikerült.")
      }
    } catch {
      setError("Hálózati hiba történt.")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Biztosan törlöd ezt a kiadást?")) return
    const response = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE", credentials: "include" })
    const data = await response.json()
    if (data.success) setExpenses(expenses.filter((e) => e.id !== id))
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-8 pb-24">

      {/* Header */}
      <section className="text-center">
        <div className="section-label justify-center">Kiadások · {year}</div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Kiadások kezelése</h1>
        <p className="text-primary font-light">Benzin, eszköz, szezonális beszerzés vagy egyéb költség.</p>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-surface rounded-lg p-6">
          <p className="text-xs font-bold text-primary/50 tracking-widest uppercase mb-2">Összes kiadás</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{total.toLocaleString("hu-HU")} Ft</p>
        </div>
        <div className="border border-border bg-surface rounded-lg p-6">
          <p className="text-xs font-bold text-primary/50 tracking-widest uppercase mb-2">Tételek száma</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{expenses.length}</p>
        </div>
        <div className="border border-border bg-surface rounded-lg p-6">
          <p className="text-xs font-bold text-primary/50 tracking-widest uppercase mb-2">János / Sanyi</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {expenses.filter((e) => e.person === "János").reduce((s, e) => s + e.amount, 0).toLocaleString("hu-HU")} / {expenses.filter((e) => e.person === "Sanyi").reduce((s, e) => s + e.amount, 0).toLocaleString("hu-HU")}
          </p>
        </div>
      </div>

      {/* New expense form */}
      {showForm && (
        <div className="border border-border bg-surface rounded-lg p-6">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-5">Új kiadás rögzítése</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex gap-3 p-4 border border-destructive/30 bg-destructive/8 rounded-lg text-sm text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />{error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className={labelClass}>Kihez tartozik?</label>
                <select value={formData.person} onChange={(e) => setFormData({ ...formData, person: e.target.value as "János" | "Sanyi" })} className={inputClass}>
                  <option value="János">János</option>
                  <option value="Sanyi">Sanyi</option>
                </select>
              </div>
              <div className="min-w-0">
                <label className={labelClass}>Dátum</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={`${inputClass} appearance-none [color-scheme:light]`} style={{ WebkitAppearance: "none" }} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Összeg (Ft)</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Leírás</label>
              <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Például benzin vagy kötözőanyag" className={inputClass} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-border text-primary text-sm font-medium hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                Mégse
              </button>
              <button type="submit" className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                Mentés
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary/50 tracking-widest uppercase">Tételek</span>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 hover:-translate-y-0.5 hover:[box-shadow:var(--shadow-card)] active:translate-y-0 active:shadow-none transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <Plus className="h-4 w-4" />
          Új kiadás
        </button>
      </div>

      {/* Expense list */}
      <div className="border border-border bg-surface rounded-lg divide-y divide-border overflow-hidden">
        {expenses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-muted-foreground text-sm mb-2">Még nincs rögzített kiadás.</p>
            <p className="text-xs text-muted-foreground/70">Új kiadás felvételéhez kattints az "Új kiadás" gombra.</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-start justify-between gap-4 px-6 py-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-accent tracking-widest uppercase">{expense.person}</span>
                  <span className="text-xs text-primary/50 font-light">{formatDate(expense.date)}</span>
                </div>
                <p className="text-base font-semibold text-foreground tracking-tight">{expense.description}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{expense.amount.toLocaleString("hu-HU")} Ft</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(expense.id)}
                className="flex-shrink-0 p-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/8 transition-colors mt-1 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
