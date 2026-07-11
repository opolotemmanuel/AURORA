import { IconPhotoScan } from "@tabler/icons-react"

// Admin-scoped counterpart to app/(dashboard)/reports/page.tsx: same
// ReportsTable, but never adds a userId filter — everyone landing on
// /admin/* has already passed requireAdminAccess in admin/layout.tsx, so
// every report is fair game here (unlike /reports, which scopes non-admins
// to their own userId).
import { ReportsTable } from "@/components/report/reports-table"
import { listReportsPage, saveAuditLog } from "@/lib/backend/report-store"
import { parseReportQuery } from "@/lib/backend/report-table-query"
import { getAdminPrincipal } from "@/lib/auth/admin"

export const dynamic = "force-dynamic"

type AdminScansPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminScansPage({ searchParams }: AdminScansPageProps) {
  const params = await searchParams
  const query = parseReportQuery(params)
  const result = await listReportsPage(query)

  // Non-null: admin/layout.tsx already gated this route.
  const principal = (await getAdminPrincipal())!
  await saveAuditLog({
    actorId: principal.id,
    actorRole: principal.role,
    action: "Viewed admin scans table",
    targetType: "admin",
    targetId: "scans",
  })

  return (
    <div className="space-y-5">
      <section className="border-b border-border pb-5">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconPhotoScan className="size-4" />
          Scans
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">All scans &amp; reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every scan and report across every user — system-wide, not scoped to one account.
        </p>
      </section>

      <ReportsTable basePath="/admin/scans" query={query} result={result} />
    </div>
  )
}
