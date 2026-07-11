// New route per this pass's sidebar spec. "Usage" here means the signed-in
// user's own scan/report activity — the only usage concept that exists
// anywhere in this app today (no separate metering/quota system exists).
// Counts are derived from listReportsPage's existing userId + dateRange
// filtering (same helper the admin reports table uses), not a new query.
import { redirect } from "next/navigation"
import { IconCamera, IconCalendarStats, IconChartBar } from "@tabler/icons-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth/session"
import { listReportsPage } from "@/lib/backend/report-store"

export const dynamic = "force-dynamic"

export default async function UsagePage() {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const [monthly, lifetime] = await Promise.all([
    listReportsPage({ page: 1, pageSize: 1, sort: "newest", userId: session.user.id, dateRange: "month" }),
    listReportsPage({ page: 1, pageSize: 1, sort: "newest", userId: session.user.id }),
  ])

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconChartBar className="size-4" />
          Usage
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Your scan usage</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          A summary of your own scan and report activity.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconCalendarStats className="size-4 text-primary" />
              This month
            </CardTitle>
            <CardDescription>Scans in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-normal">{monthly.pagination.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconCamera className="size-4 text-primary" />
              All time
            </CardTitle>
            <CardDescription>Total scans on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-normal">{lifetime.pagination.total}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
