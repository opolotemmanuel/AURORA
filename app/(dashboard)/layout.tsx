// Thin per AGENTS.md convention — chrome logic lives in DashboardShell.
// Gates the whole group (user + admin routes) behind a signed-in session;
// the /admin route additionally requires an admin role via
// lib/auth/admin.ts's requireAdminAccess (see app/(dashboard)/admin/layout.tsx).
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CURRENT_PATH_HEADER } from "@/middleware"
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
    // Only reached if a stale/invalid session cookie passed middleware's
    // cheap presence check but fails this real one — same callbackURL
    // round-trip as middleware's own redirect, so the user still lands
    // back where they started after signing in again.
    const currentPath = (await headers()).get(CURRENT_PATH_HEADER)
    redirect(`/login?callbackURL=${encodeURIComponent(currentPath ?? "/dashboard")}`)
  }

  // Only used to decide whether the sidebar shows admin-only links — the
  // actual route protection still lives in admin/layout.tsx, this is just
  // avoiding showing a link a plain USER can't follow.
  const isAdminTier = Boolean(await getAdminPrincipal())

  return <DashboardShell isAdminTier={isAdminTier}>{children}</DashboardShell>
}
