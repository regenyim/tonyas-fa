import { Skeleton } from "@/components/ui/skeleton"

export default function ReservationsLoading() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <section>
        <Skeleton className="h-3 w-36 mb-3" />
        <Skeleton className="h-9 w-96 mb-3" />
        <Skeleton className="h-4 w-[480px] max-w-full" />
      </section>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Reservation rows */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-border bg-surface rounded-lg px-5 py-4 flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="hidden sm:flex gap-6 items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
