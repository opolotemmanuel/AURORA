import { Skeleton } from "@/components/ui/skeleton"

export function ScanPageSkeleton() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-4 rounded-[2rem] border border-border bg-background p-3">
        <div className="space-y-2 px-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Skeleton className="h-4 w-36 rounded-md bg-muted/50" />
            <Skeleton className="h-8 w-44 rounded-lg bg-muted/50" />
          </div>
          <Skeleton className="h-3 w-48 max-w-full rounded-md bg-muted/40" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl bg-muted/40" />
      </div>
    </div>
  )
}
