"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CalendarPickerProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  availableDates?: string[]
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

const monthNames = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
]

const dayNames = ["H", "K", "Sze", "Cs", "P", "Szo", "V"]

export default function CalendarPicker({ selectedDate, onDateSelect, availableDates }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), 11, 1))
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const days: string[] = availableDates ?? data.settings?.availableDays ?? []
        setAvailableDays(days)

        if (days.length > 0) {
          const [year, month] = days.slice().sort()[0].split("-")
          setCurrentMonth(new Date(Number(year), Number(month) - 1, 1))
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [availableDates])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  // Convert Sunday-based (0=Sun) to Monday-based (0=Mon)
  const firstDayRaw = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const firstDay = (firstDayRaw + 6) % 7

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const sorted = availableDays.slice().sort()
  const minMonth = sorted.length > 0
    ? (() => { const [y, m] = sorted[0].split("-"); return new Date(Number(y), Number(m) - 1, 1) })()
    : null
  const maxMonth = sorted.length > 0
    ? (() => { const [y, m] = sorted[sorted.length - 1].split("-"); return new Date(Number(y), Number(m) - 1, 1) })()
    : null

  const canGoPrev = minMonth === null || currentMonth > minMonth
  const canGoNext = maxMonth === null || currentMonth < maxMonth

  return (
    <Card className="overflow-hidden border-primary/10 bg-surface/80 px-0 py-0">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Előző hónap"
            className="rounded-full border border-primary/10 p-2 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
            disabled={!canGoPrev}
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {currentMonth.getFullYear()}. {monthNames[currentMonth.getMonth()]}
          </p>

          <button
            type="button"
            aria-label="Következő hónap"
            className="rounded-full border border-primary/10 p-2 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
            disabled={!canGoNext}
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-foreground/48">
          {dayNames.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => {
                if (!day) return <div key={`${weekIndex}-${dayIndex}`} className="h-11" />

                const dateStr = toDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                const isSelected = selectedDate === dateStr
                const isAvailable = availableDays.includes(dateStr)

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => onDateSelect(isSelected ? "" : dateStr)}
                    className={`h-11 rounded-2xl text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 ${
                      isSelected
                        ? "bg-primary text-primary-foreground cursor-pointer"
                        : isAvailable
                          ? "bg-[color:var(--mint-soft)] text-[color:var(--mint-strong)] hover:brightness-95 cursor-pointer"
                          : "text-foreground/25 cursor-not-allowed"
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-primary/8 bg-secondary/30 px-5 py-4 text-sm text-foreground/62 sm:px-6">
        {isLoading
          ? "Elérhető napok betöltése..."
          : availableDays.length > 0
            ? "A kiemelt napok választhatók foglaláshoz."
            : "Jelenleg nincs foglalható nap beállítva."}
      </div>
    </Card>
  )
}
