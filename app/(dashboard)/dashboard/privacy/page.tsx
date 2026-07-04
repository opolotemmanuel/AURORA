import { Suspense } from "react"

import { PrivacyControlsLoader } from "@/components/dashboard/privacy-controls-loader"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { Skeleton } from "@/components/ui/skeleton"

function PrivacyControlsSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Privacy"
        description="Delete individual items or all personal data. Account deletion is permanent."
      />
      <Suspense fallback={<PrivacyControlsSkeleton />}>
        <PrivacyControlsLoader />
      </Suspense>
    </div>
  )
}
