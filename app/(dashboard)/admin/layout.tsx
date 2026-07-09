// Gates every /admin/* route behind a single admin-tier check, so
// individual admin pages don't each need their own AdminAccessError
// try/catch (see app/(dashboard)/admin/page.tsx and admin/settings/page.tsx,
// which still layer their own stronger permission checks, e.g.
// "settings:manage", on top of this baseline "admin:read" gate).
import { AccessDenied } from "@/components/admin/access-denied"
import { AdminAccessError, requireAdminAccess } from "@/lib/auth/admin"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  try {
    await requireAdminAccess("admin:read")
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return <AccessDenied note={error.access.note} />
    }
    throw error
  }

  return children
}
