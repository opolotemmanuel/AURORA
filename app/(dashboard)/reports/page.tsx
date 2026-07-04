import { Suspense } from "react"

import { ReportsList } from "@/components/dashboard/reports-list"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { ReportsListSkeleton } from "@/components/dashboard/skeletons/reports-list-skeleton"

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Reports"
        description="Your scan history with token usage, costs, dimension profiles, and downloadable PDF reports."
      />

      <Suspense fallback={<ReportsListSkeleton />}>
        <ReportsList />
      </Suspense>
    </div>
  )
}
