"use client"

// Client wrapper around the Users table so a successful delete can update
// the UI immediately (row removed, brief success confirmation) without a
// full page reload — the server action already calls revalidatePath, this
// just makes the in-page experience instant instead of waiting on the next
// navigation to pick that up.
import { useEffect, useState } from "react"

import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type UserRow = {
  id: string
  name?: string
  email: string
  role: string
  createdAt: string
}

const ADMIN_TIER_ROLES = new Set(["OWNER", "ADMIN"])

export function UsersTable({
  initialUsers,
  currentUserId,
  initialAdminTierCount,
  canDelete,
}: {
  initialUsers: UserRow[]
  currentUserId: string
  initialAdminTierCount: number
  canDelete: boolean
}) {
  const [users, setUsers] = useState(initialUsers)
  const [adminTierCount, setAdminTierCount] = useState(initialAdminTierCount)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!successMessage) return
    const timeout = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timeout)
  }, [successMessage])

  function handleDeleted(deletedUser: UserRow) {
    setUsers((current) => current.filter((user) => user.id !== deletedUser.id))
    if (ADMIN_TIER_ROLES.has(deletedUser.role)) {
      setAdminTierCount((count) => count - 1)
    }
    setSuccessMessage(`${deletedUser.name ?? deletedUser.email} was deleted.`)
  }

  return (
    <div className="space-y-3">
      {successMessage ? (
        <div className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground">
          {successMessage}
        </div>
      ) : null}

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                {canDelete ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId
                const isLastAdmin = ADMIN_TIER_ROLES.has(user.role) && adminTierCount <= 1
                const disabled = isSelf || isLastAdmin
                const disabledReason = isSelf
                  ? "You cannot delete your own account."
                  : isLastAdmin
                    ? "Cannot delete the last remaining admin account."
                    : undefined

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "USER" ? "secondary" : "default"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    {canDelete ? (
                      <TableCell className="text-right">
                        <DeleteUserDialog
                          user={user}
                          disabled={disabled}
                          disabledReason={disabledReason}
                          onDeleted={() => handleDeleted(user)}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {users.length === 0 ? (
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">No registered users yet.</p>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}
