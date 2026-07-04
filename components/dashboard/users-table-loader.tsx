import { headers } from "next/headers"

import { UsersTable } from "@/components/admin/users-table"
import { auth } from "@/lib/auth/server"

export async function UsersTableLoader() {
  const usersResult = await auth.api.listUsers({
    query: { limit: 100 },
    headers: await headers(),
  })

  return (
    <UsersTable
      initialUsers={
        (usersResult?.users ?? []) as Parameters<typeof UsersTable>[0]["initialUsers"]
      }
    />
  )
}
