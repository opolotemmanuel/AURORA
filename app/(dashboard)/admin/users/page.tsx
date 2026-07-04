import { headers } from "next/headers"

import { UsersTable } from "@/components/admin/users-table"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { auth } from "@/lib/auth/server"
import { requireAdmin } from "@/lib/auth/session"

export default async function AdminUsersPage() {
  await requireAdmin()

  const usersResult = await auth.api.listUsers({
    query: { limit: 100 },
    headers: await headers(),
  })

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Users"
        description="Block, change roles, impersonate, or delete user accounts."
        badge="Admin"
      />
      <UsersTable
        initialUsers={(usersResult?.users ?? []) as Parameters<typeof UsersTable>[0]["initialUsers"]}
      />
    </div>
  )
}
