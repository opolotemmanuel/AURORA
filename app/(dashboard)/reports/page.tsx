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
  // (dashboard)/layout.tsx already guarantees a session here — this just
  // reads it to scope non-admin users to their own reports.
  const session = (await getSession())!
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
          Manage, search and export all Aurora SkinSense reports.
        </p>
      </section>

      <ReportsTable basePath="/reports" query={query} result={result} />
    </div>
  )
}
