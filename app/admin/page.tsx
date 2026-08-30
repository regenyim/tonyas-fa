import { CalendarDays, DollarSign, Trees, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { listReservations } from "@/lib/reservations"
import { getSettings } from "@/lib/settings"
import { getExpensesSummary } from "@/lib/expenses"
import { getViewYear } from "@/lib/years"
import { formatPrice } from "@/lib/utils"

async function getStats(year: number) {
  const reservations = await listReservations({ year })
  const settings = await getSettings(year)
  const expensesSummary = await getExpensesSummary(year)

  const totalReservations = reservations.length
  const totalTrees = reservations.reduce((sum, reservation) => sum + reservation.treeCount, 0)
  const now = new Date()
  const nextWeekend = getNextWeekend(now)
  const upcomingReservations = reservations.filter((reservation) => {
    const visitDate = new Date(reservation.visitDate)
    return visitDate >= nextWeekend.start && visitDate <= nextWeekend.end
  })

  const paidReservations = reservations.filter((reservation) => reservation.paidTo)
  const revenueJanos = paidReservations.filter((reservation) => reservation.paidTo === "János").reduce((sum, reservation) => sum + reservation.treeCount * settings.pricePerTree, 0)
  const revenueSanyi = paidReservations.filter((reservation) => reservation.paidTo === "Sanyi").reduce((sum, reservation) => sum + reservation.treeCount * settings.pricePerTree, 0)
  const totalRevenue = revenueJanos + revenueSanyi
  const totalExpenses = expensesSummary.total

  return {
    totalReservations,
    totalTrees,
    upcomingReservations: upcomingReservations.length,
    nextWeekendLabel: `${nextWeekend.start.toLocaleDateString("hu-HU")} - ${nextWeekend.end.toLocaleDateString("hu-HU")}`,
    revenueJanos,
    revenueSanyi,
    totalRevenue,
    totalExpenses,
    janosNet: revenueJanos - expensesSummary.janos,
    sanyiNet: revenueSanyi - expensesSummary.sanyi,
    totalNet: totalRevenue - totalExpenses,
    janosExpenses: expensesSummary.janos,
    sanyiExpenses: expensesSummary.sanyi,
  }
}

function getNextWeekend(date: Date) {
  const current = new Date(date)
  const day = current.getDay()
  const start = new Date(current)
  const end = new Date(current)

  if (day === 0) {
    start.setDate(current.getDate() + 6)
    end.setDate(current.getDate() + 7)
  } else if (day === 6) {
    end.setDate(current.getDate() + 1)
  } else {
    start.setDate(current.getDate() + (6 - day))
    end.setDate(current.getDate() + (7 - day))
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const money = formatPrice

export default async function AdminDashboard() {
  const year = await getViewYear()
  const stats = await getStats(year)

  const overviewCards = [
    { label: "Összes foglalás", value: stats.totalReservations, help: "Minden rögzített foglalás", icon: CalendarDays },
    { label: "Összes várható fa", value: stats.totalTrees, help: "Bejelölt vagy várható darabszámok", icon: Trees },
    { label: "Közelgő foglalások", value: stats.upcomingReservations, help: stats.nextWeekendLabel, icon: TrendingUp },
    { label: "Nettó összesen", value: money(stats.totalNet), help: `Kiadás után maradó összeg`, icon: Wallet },
  ]

  const revenueCards = [
    {
      label: "János bevétele",
      value: money(stats.revenueJanos),
      expense: `Kiadás: ${money(stats.janosExpenses)}`,
      net: `Nettó: ${money(stats.janosNet)}`,
      icon: DollarSign,
    },
    {
      label: "Sanyi bevétele",
      value: money(stats.revenueSanyi),
      expense: `Kiadás: ${money(stats.sanyiExpenses)}`,
      net: `Nettó: ${money(stats.sanyiNet)}`,
      icon: DollarSign,
    },
    {
      label: "Összes bevétel",
      value: money(stats.totalRevenue),
      expense: `Összes kiadás: ${money(stats.totalExpenses)}`,
      net: `Nettó összesen: ${money(stats.totalNet)}`,
      icon: TrendingUp,
      accent: "green" as const,
    },
    {
      label: "Összes kiadás",
      value: money(stats.totalExpenses),
      expense: `János: ${money(stats.janosExpenses)}`,
      net: `Sanyi: ${money(stats.sanyiExpenses)}`,
      icon: TrendingDown,
      accent: "red" as const,
    },
  ]

  return (
    <div className="space-y-10 pb-24">

      {/* Header */}
      <section className="text-center">
        <div className="section-label justify-center">Áttekintés · {year}</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 tracking-tight">Dashboard</h1>
        <p className="text-primary font-light max-w-md mx-auto">A legfontosabb számok és gyors műveletek egy helyen.</p>
      </section>

      {/* Overview stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((item) => (
          <div key={item.label} className="border border-border bg-surface rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-primary/50 tracking-widest uppercase">{item.label}</p>
              <item.icon className="h-4 w-4 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight mb-1">{item.value}</p>
            <p className="text-sm text-primary font-light">{item.help}</p>
          </div>
        ))}
      </section>

      {/* Revenue breakdown */}
      <section>
        <div className="section-label justify-center mb-3">Pénzügyek</div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6 text-center">Bevétel és kiadás</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {revenueCards.map((item) => (
            <div key={item.label} className={`border rounded-lg p-6 ${'accent' in item && item.accent === 'green' ? 'border-emerald-200 bg-emerald-50/60' : 'accent' in item && item.accent === 'red' ? 'border-red-200 bg-red-50/60' : 'border-border bg-surface'}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-primary/50 tracking-widest uppercase">{item.label}</p>
                <item.icon className={`h-4 w-4 ${'accent' in item && item.accent === 'green' ? 'text-emerald-600' : 'accent' in item && item.accent === 'red' ? 'text-red-500' : 'text-secondary'}`} />
              </div>
              <p className={`text-2xl font-bold tracking-tight mb-3 ${'accent' in item && item.accent === 'green' ? 'text-emerald-700' : 'accent' in item && item.accent === 'red' ? 'text-red-600' : 'text-foreground'}`}>{item.value}</p>
              <div className="space-y-1 border-t border-border pt-3">
                <p className="text-xs text-primary font-light">{item.expense}</p>
                <p className="text-xs font-semibold text-foreground">{item.net}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
