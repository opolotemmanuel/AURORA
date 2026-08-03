"use client"

// Client wrapper around the Users table so a successful delete can update
// the UI immediately (row removed, brief success confirmation) without a
// full page reload — the server action already calls revalidatePath, this
// just makes the in-page experience instant instead of waiting on the next
// navigation to pick that up. Console-style redesign adds a shared toolbar,
// a removable role filter chip, sortable headers, and pagination — all
// operating on the full user array already returned by listUsers() (no new
// query, no new query params).
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconUsers } from "@tabler/icons-react"

import { downloadCsv } from "@/lib/csv-export"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { SingleSelectFilterChips } from "@/components/admin/filter-chip-bar"
import { PaginationFooter } from "@/components/admin/pagination-footer"
import { SortableHeader } from "@/components/admin/sortable-header"
import { ConsoleToolbar } from "@/components/admin/settings/console-toolbar"
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
const PAGE_SIZE = 25

type SortKey = "name" | "email" | "role" | "createdAt"
type SortState = { key: SortKey; direction: "asc" | "desc" } | null

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
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [adminTierCount, setAdminTierCount] = useState(initialAdminTierCount)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [sort, setSort] = useState<SortState>(null)
  const [page, setPage] = useState(1)

  // Refresh re-runs the server component (same listUsers()/
  // countAdminTierUsers() calls) and passes fresh props down; local state
  // only takes its *initial* value from props, so it has to be resynced
  // explicitly here.
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  useEffect(() => {
    setAdminTierCount(initialAdminTierCount)
  }, [initialAdminTierCount])

  useEffect(() => {
    if (!successMessage) return
    const timeout = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timeout)
  }, [successMessage])

  const roleOptions = useMemo(() => {
    const unique = new Set(users.map((user) => user.role))
    return Array.from(unique)
      .sort()
      .map((role) => ({ value: role, label: role }))
  }, [users])

  const filtered = useMemo(() => {
    if (roleFilter === "all") return users
    return users.filter((user) => user.role === roleFilter)
  }, [users, roleFilter])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, direction } = sort
    const factor = direction === "asc" ? 1 : -1

    return [...filtered].sort((a, b) => {
      const aValue = key === "name" ? (a.name ?? "") : a[key]
      const bValue = key === "name" ? (b.name ?? "") : b[key]
      return String(aValue).localeCompare(String(bValue)) * factor
    })
  }, [filtered, sort])

  const pageCount = Math.max(Math.ceil(sorted.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  function toggleSort(key: SortKey) {
    setPage(1)
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" }
      if (current.direction === "asc") return { key, direction: "desc" }
      return null
    })
  }

  function handleDeleted(deletedUser: UserRow) {
    setUsers((current) => current.filter((user) => user.id !== deletedUser.id))
    if (ADMIN_TIER_ROLES.has(deletedUser.role)) {
      setAdminTierCount((count) => count - 1)
    }
    setSuccessMessage(`${deletedUser.name ?? deletedUser.email} was deleted.`)
  }

  function handleExport() {
    downloadCsv(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Email", "Role", "Created"],
      sorted.map((user) => [user.name ?? "", user.email, user.role, user.createdAt]),
    )
  }

  function headerProps(key: SortKey) {
    return {
      active: sort?.key === key,
      direction: sort?.key === key ? sort.direction : undefined,
      onSort: () => toggleSort(key),
    }
  }

  return (
    <div className="space-y-5">
      <ConsoleToolbar
        icon={IconUsers}
        eyebrow="Users"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        title="Registered users"
        description="Every account registered on Aurora Organics."
        onRefresh={() => router.refresh()}
        onExport={handleExport}
        exportDisabled={sorted.length === 0}
      >
        <SingleSelectFilterChips
          value={roleFilter}
          options={roleOptions}
          onChange={(value) => {
            setPage(1)
            setRoleFilter(value)
          }}
        />
      </ConsoleToolbar>

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
                <SortableHeader label="Name" {...headerProps("name")} />
                <SortableHeader label="Email" {...headerProps("email")} />
                <SortableHeader label="Role" {...headerProps("role")} />
                <SortableHeader label="Created" {...headerProps("createdAt")} />
                {canDelete ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((user) => {
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
        ) : sorted.length === 0 ? (
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">No users match this filter.</p>
          </CardContent>
        ) : null}
      </Card>

      {users.length > 0 ? (
        <PaginationFooter
          start={sorted.length === 0 ? 0 : pageStart + 1}
          end={Math.min(pageStart + PAGE_SIZE, sorted.length)}
          total={sorted.length}
          itemLabel="users"
          page={currentPage}
          pageCount={pageCount}
          prev={currentPage > 1 ? { onClick: () => setPage(currentPage - 1) } : null}
          next={currentPage < pageCount ? { onClick: () => setPage(currentPage + 1) } : null}
        />
      ) : null}
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}
