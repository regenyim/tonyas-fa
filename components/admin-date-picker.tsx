"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"

interface AdminDatePickerProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  highlightDays?: string[]
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

export default function AdminDatePicker({ selectedDate, onDateSelect, highlightDays }: AdminDatePickerProps) {
  const initialMonth = () => {
    if (selectedDate) {
      const [year, month] = selectedDate.split("-")
      return new Date(Number(year), Number(month) - 1, 1)
    }

    if (highlightDays && highlightDays.length > 0) {
      const [year, month] = highlightDays.slice().sort()[0].split("-")
      return new Date(Number(year), Number(month) - 1, 1)
    }

    return new Date(new Date().getFullYear(), 11, 1)
  }

  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayRaw = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const firstDay = (firstDayRaw + 6) % 7

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <Card className="overflow-hidden border-primary/10 bg-surface/80 px-0 py-0">
      <div className="px-3 py-3 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Előző hónap"
            className="rounded-full border border-primary/10 p-2 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
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
            className="rounded-full border border-primary/10 p-2 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-foreground/48">
          {dayNames.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((day, dayIndex) => {
                if (!day) return <div key={`${weekIndex}-${dayIndex}`} className="h-8 sm:h-10" />

                const dateStr = toDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                const isSelected = selectedDate === dateStr
                const isHighlighted = highlightDays ? highlightDays.includes(dateStr) : true

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onDateSelect(isSelected ? "" : dateStr)}
                    title={!isHighlighted && !isSelected ? "Nem elérhető nap (admin felülírás)" : undefined}
                    className={`h-8 sm:h-10 rounded-2xl text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 ${
                      isSelected
                        ? "bg-primary text-primary-foreground cursor-pointer"
                        : isHighlighted
                          ? "bg-[color:var(--mint-soft)] text-[color:var(--mint-strong)] hover:brightness-95 cursor-pointer"
                          : "text-foreground/30 hover:bg-foreground/8 hover:text-foreground/50 cursor-pointer"
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
    </Card>
  )
}
