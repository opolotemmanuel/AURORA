import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import { saveAuditLog } from "@/lib/backend/report-store"
import { requireAdminAccess } from "@/lib/auth/admin"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const auth = requireAdminAccess("admin:read")

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Viewed admin dashboard",
    targetType: "admin",
    targetId: "dashboard",
  })

  return <AdminDashboard backendAnalytics={await getAdminAnalytics()} />
}
