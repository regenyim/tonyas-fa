import { Skeleton } from "@/components/ui/skeleton"

export default function ExpensesLoading() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <section>
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-9 w-80 mb-3" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border bg-surface rounded-lg p-6">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Add expense button */}
      <Skeleton className="h-10 w-36 rounded-lg" />

      {/* Expense rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border bg-surface rounded-lg px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="hidden sm:flex gap-6 items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
