import { IconChartBar } from "@tabler/icons-react"

import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import { saveAuditLog } from "@/lib/backend/report-store"
import { getAdminPrincipal } from "@/lib/auth/admin"

export const dynamic = "force-dynamic"

export default async function AdminAnalyticsPage() {
  // Non-null: the parent (dashboard)/admin/layout.tsx already gated access,
  // this just re-reads the principal for the audit log below.
  const principal = (await getAdminPrincipal())!

  const analytics = await getAdminAnalytics()

  await saveAuditLog({
    actorId: principal.id,
    actorRole: principal.role,
    action: "Viewed admin analytics",
    targetType: "admin",
    targetId: "analytics",
  })

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconChartBar className="size-4" />
          Enterprise Operations
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Analytics</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Real platform activity from PostgreSQL — every number below traces to an actual scan, report, or
          account record, not a placeholder.
        </p>
      </section>

      <AdminDashboard analytics={analytics} />
    </div>
  )
}
