import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import { saveAuditLog } from "@/lib/backend/report-store"
import { getAdminPrincipal } from "@/lib/auth/admin"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  // Non-null: the parent (dashboard)/admin/layout.tsx already gated access,
  // this just re-reads the principal for the audit log below.
  const principal = (await getAdminPrincipal())!

  await saveAuditLog({
    actorId: principal.id,
    actorRole: principal.role,
    action: "Viewed admin dashboard",
    targetType: "admin",
    targetId: "dashboard",
  })

  return <AdminDashboard backendAnalytics={await getAdminAnalytics()} />
}
