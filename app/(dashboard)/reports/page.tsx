import { redirect } from "next/navigation"
import { IconReportAnalytics } from "@tabler/icons-react"

import { ReportsTable } from "@/components/report/reports-table"
import { listReportsPage, saveAuditLog } from "@/lib/backend/report-store"
import { parseReportQuery } from "@/lib/backend/report-table-query"
import { getAdminPrincipal } from "@/lib/auth/admin"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams
  const query = parseReportQuery(params)
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const isAdminTier = Boolean(await getAdminPrincipal())
  const scopedQuery = isAdminTier ? query : { ...query, userId: session.user.id }
  const result = await listReportsPage(scopedQuery)

  await saveAuditLog({
    action: "Viewed reports table",
    targetType: "report",
    targetId: "reports-index",
  })

  return (
    <div className="space-y-5">
      <section className="border-b border-border pb-5">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconReportAnalytics className="size-4" />
          Reports
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage, search and export all Aurora Organics reports.
        </p>
      </section>

      <ReportsTable basePath="/reports" query={query} result={result} />
    </div>
  )
}
