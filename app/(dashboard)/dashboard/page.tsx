import Link from "next/link"
import { Suspense } from "react"
import { IconCamera } from "@tabler/icons-react"

import { DashboardOverviewStats } from "@/components/dashboard/dashboard-overview-stats"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DashboardStatsSkeleton } from "@/components/dashboard/skeletons/dashboard-stats-skeleton"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Overview"
        description="Your credits, recent scans, and skin reports in one place."
      />

      <section className="rounded-none border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-medium">Ready for a scan?</h2>
            <p className="text-sm text-muted-foreground">
              Capture or upload a photo for personalized cosmetic guidance and
              product recommendations.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/scan">
              <IconCamera className="size-4" />
              Start your scan
            </Link>
          </Button>
        </div>
      </section>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardOverviewStats />
      </Suspense>
    </div>
  )
}
