import { Skeleton } from "@/components/ui/skeleton"
import { StatCardsSkeleton } from "@/components/dashboard/skeletons/stat-cards-skeleton"

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function AdminUsageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="surface-panel rounded-xl border border-border/60 p-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[200px]" />
        </div>
      </div>

      <StatCardsSkeleton count={4} />
      <StatCardsSkeleton count={4} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel rounded-xl border border-border/60 p-5">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4">
            <TableSkeleton rows={5} />
          </div>
        </div>
        <div className="surface-panel rounded-xl border border-border/60 p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4">
            <TableSkeleton rows={4} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel rounded-xl border border-border/60 p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-48 w-full rounded-lg" />
        </div>
        <div className="surface-panel rounded-xl border border-border/60 p-5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-4 h-48 w-full rounded-lg" />
        </div>
      </div>

      <div className="surface-panel rounded-xl border border-border/60 p-5">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4">
          <TableSkeleton rows={6} />
        </div>
      </div>

      <div className="surface-panel rounded-xl border border-border/60 p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4">
          <TableSkeleton rows={5} />
        </div>
      </div>

      <div className="surface-panel rounded-xl border border-border/60 p-5">
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  )
}
