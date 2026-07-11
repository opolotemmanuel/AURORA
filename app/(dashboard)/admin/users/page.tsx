import { IconUsers } from "@tabler/icons-react"

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
      <section className="border-b border-border pb-5">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconUsers className="size-4" />
          Users
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">Registered users</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every account registered on Aurora SkinSense.
        </p>
      </section>

      <UsersTable
        initialUsers={users}
        currentUserId={principal.id}
        initialAdminTierCount={adminTierCount}
        canDelete={deleteAccess.allowed}
      />
    </div>
  )
}
