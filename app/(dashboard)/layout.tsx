// Thin per AGENTS.md convention — chrome logic lives in DashboardShell.
// Gates the whole group (user + admin routes) behind a signed-in session;
// the /admin route additionally requires an admin role via
// lib/auth/admin.ts's requireAdminAccess (see app/(dashboard)/admin/layout.tsx).
import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { getAdminPrincipal } from "@/lib/auth/admin"
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

  // Only used to decide whether the sidebar shows admin-only links — the
  // actual route protection still lives in admin/layout.tsx, this is just
  // avoiding showing a link a plain USER can't follow.
  const isAdminTier = Boolean(await getAdminPrincipal())

  return <DashboardShell isAdminTier={isAdminTier}>{children}</DashboardShell>
}
