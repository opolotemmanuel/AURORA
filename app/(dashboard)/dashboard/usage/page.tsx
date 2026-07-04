import { Suspense } from "react"

import { UsageStats } from "@/components/dashboard/usage-stats"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { UsageStatsSkeleton } from "@/components/dashboard/skeletons/usage-stats-skeleton"

export default function UsagePage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Usage"
        description="Token balance and consumption across scans and AI activity."
      />

      <Suspense fallback={<UsageStatsSkeleton />}>
        <UsageStats />
      </Suspense>
    </div>
  )
}
