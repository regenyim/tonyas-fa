import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-10 pb-24 max-w-2xl">
      {/* Header */}
      <section>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-9 w-64 mb-3" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </section>

      {/* Form fields */}
      <div className="border border-border bg-surface rounded-lg p-6 sm:p-8 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}

        <div className="pt-2">
          <Skeleton className="h-3 w-28 mb-3" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
