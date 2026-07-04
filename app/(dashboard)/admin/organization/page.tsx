import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { requireRole } from "@/lib/auth/session"

export default async function OrganizationPage() {
  await requireRole(["admin", "company_admin"])

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Organization"
        description="Company workspace, members, and org-scoped products — coming soon."
        badge="Soon"
      />
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Organization management will use better-auth organization plugin.
      </div>
    </div>
  )
}
