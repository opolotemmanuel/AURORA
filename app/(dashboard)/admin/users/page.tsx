import { AccessDenied } from "@/components/admin/access-denied"
import { UsersTable } from "@/components/admin/users-table"
import { countAdminTierUsers, listUsers } from "@/lib/backend/admin-users"
import { saveAuditLog } from "@/lib/backend/report-store"
import { AdminAccessError, assertAdminAccess, requireAdminAccess } from "@/lib/auth/admin"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  let principal
  try {
    ;({ principal } = await requireAdminAccess("users:read"))
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return <AccessDenied note={error.access.note} />
    }
    throw error
  }

  const [users, adminTierCount, deleteAccess] = await Promise.all([
    listUsers(),
    countAdminTierUsers(),
    assertAdminAccess("users:delete"),
  ])

  await saveAuditLog({
    actorId: principal.id,
    actorRole: principal.role,
    action: "Viewed admin users table",
    targetType: "admin",
    targetId: "users",
  })

  return (
    <div className="space-y-5">
      <UsersTable
        initialUsers={users}
        currentUserId={principal.id}
        initialAdminTierCount={adminTierCount}
        canDelete={deleteAccess.allowed}
      />
    </div>
  )
}
