import { Skeleton } from "@/components/ui/skeleton"

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      <div className="space-y-4 rounded-none border border-border bg-card p-5 sm:p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-none" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-none" />
      </div>
    </div>
  )
}
