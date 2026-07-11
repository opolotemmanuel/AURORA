import { IconUsers } from "@tabler/icons-react"

import { AccessDenied } from "@/components/admin/access-denied"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listUsers } from "@/lib/backend/admin-users"
import { saveAuditLog } from "@/lib/backend/report-store"
import { AdminAccessError, requireAdminAccess } from "@/lib/auth/admin"

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

  const users = await listUsers()

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
          Every account registered on Aurora SkinSense — read-only.
        </p>
      </section>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "USER" ? "secondary" : "default"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
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
