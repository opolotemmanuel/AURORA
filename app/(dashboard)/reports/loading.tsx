// Next.js route convention: automatically shown while ReportsPage's async
// data fetch (listReportsPage etc.) is in flight — shape mirrors the real
// table/filter-bar layout so there's no layout shift once data arrives.
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <div className="space-y-5">
      <section className="border-b border-border pb-5">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="mt-3 h-8 w-40 rounded-md" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-md" />
      </section>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto_auto]">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted px-4 py-3">
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[0.2fr_0.7fr_1fr_0.7fr_0.7fr_0.7fr_1.4fr_0.8fr_0.8fr_0.8fr_0.4fr] gap-3 px-4 py-4">
              {Array.from({ length: 11 }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className="h-4 rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
