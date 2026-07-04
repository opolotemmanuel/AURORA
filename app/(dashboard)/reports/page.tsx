import Link from "next/link"
import { Suspense } from "react"

import { ReportsList } from "@/components/dashboard/reports-list"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { ReportsListSkeleton } from "@/components/dashboard/skeletons/reports-list-skeleton"

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Reports"
        description="Your scan history and cosmetic assessment results."
      />

      <Suspense fallback={<ReportsListSkeleton />}>
        <ReportsList />
      </Suspense>

      <p className="text-xs text-muted-foreground">
        Delete individual scans from{" "}
        <Link href="/dashboard/privacy" className="underline underline-offset-4">
          Privacy
        </Link>
        .
      </p>
    </div>
  )
}
