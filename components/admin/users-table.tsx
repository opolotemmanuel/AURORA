"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth/client"

type AdminUser = {
  id: string
  name: string
  email: string
  role?: string | null
  banned?: boolean | null
}

export function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function refresh() {
    const { data } = await authClient.admin.listUsers({ query: { limit: 100 } })
    if (data?.users) setUsers(data.users as AdminUser[])
  }

  async function banUser(userId: string) {
    setLoadingId(userId)
    await authClient.admin.banUser({ userId, banReason: "Blocked by admin" })
    await refresh()
    setLoadingId(null)
  }

  async function unbanUser(userId: string) {
    setLoadingId(userId)
    await authClient.admin.unbanUser({ userId })
    await refresh()
    setLoadingId(null)
  }

  async function impersonate(userId: string) {
    setLoadingId(userId)
    await authClient.admin.impersonateUser({ userId })
    window.location.href = "/dashboard"
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role ?? "user"}</TableCell>
              <TableCell>{user.banned ? "Banned" : "Active"}</TableCell>
              <TableCell className="space-x-2 text-right">
                {user.banned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === user.id}
                    onClick={() => unbanUser(user.id)}
                  >
                    Unban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === user.id}
                    onClick={() => banUser(user.id)}
                  >
                    Ban
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loadingId === user.id}
                  onClick={() => impersonate(user.id)}
                >
                  Impersonate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
