import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <section className="text-center">
        <Skeleton className="h-3 w-32 mx-auto mb-4" />
        <Skeleton className="h-12 w-56 mx-auto mb-3" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </section>

      {/* Overview stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border bg-surface rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4 rounded-sm" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </section>

      {/* Revenue section */}
      <section>
        <Skeleton className="h-3 w-20 mx-auto mb-3" />
        <Skeleton className="h-7 w-48 mx-auto mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border bg-surface rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-4 rounded-sm" />
              </div>
              <Skeleton className="h-8 w-24 mb-3" />
              <div className="space-y-1.5 border-t border-border pt-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
