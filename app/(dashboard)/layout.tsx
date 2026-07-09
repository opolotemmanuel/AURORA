// Thin per AGENTS.md convention — chrome logic lives in DashboardShell.
// Gates the whole group (user + admin routes) behind a signed-in session;
// the /admin route additionally requires an admin role via
// lib/auth/admin.ts's requireAdminAccess (see app/(dashboard)/admin/page.tsx).
import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { getSession } from "@/lib/auth/session"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return <DashboardShell>{children}</DashboardShell>
}
