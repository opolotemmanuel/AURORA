import { Skeleton } from "@/components/ui/skeleton"

export function ScanPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      <div className="flex justify-center gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}
