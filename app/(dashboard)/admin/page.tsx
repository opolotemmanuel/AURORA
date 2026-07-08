import { AccessDenied } from "@/components/admin/access-denied"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import { saveAuditLog } from "@/lib/backend/report-store"
import { AdminAccessError, requireAdminAccess } from "@/lib/auth/admin"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  let auth
  try {
    auth = await requireAdminAccess("admin:read")
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return <AccessDenied note={error.access.note} />
    }
    throw error
  }

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Viewed admin dashboard",
    targetType: "admin",
    targetId: "dashboard",
  })

  return <AdminDashboard backendAnalytics={await getAdminAnalytics()} />
}
