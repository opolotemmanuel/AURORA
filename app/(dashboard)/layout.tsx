// Thin per AGENTS.md convention — chrome logic lives in DashboardShell.
// Gates the whole group (user + admin routes) behind a signed-in session;
// the /admin route additionally requires an admin role via
// lib/auth/admin.ts's requireAdminAccess (see app/(dashboard)/admin/layout.tsx).
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CURRENT_PATH_HEADER } from "@/proxy"
import { AuthUnavailable } from "@/components/auth/auth-unavailable"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { getAdminPrincipal } from "@/lib/auth/admin"
import { resolveSession } from "@/lib/auth/resolve-session"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const result = await resolveSession()

  if (result.status === "db_unavailable") {
    // A signed-in user hit a transient DB outage during the session
    // lookup itself — show the reconnecting screen instead of bouncing
    // them to /login, which would be both wrong and confusing.
    return <AuthUnavailable />
  }

  if (result.status === "none") {
    // Only reached if a stale/invalid session cookie passed proxy's cheap
    // presence check but fails this real one — same callbackURL round-trip
    // as proxy's own redirect, so the user still lands back where they
    // started after signing in again.
    const currentPath = (await headers()).get(CURRENT_PATH_HEADER)
    redirect(`/login?callbackURL=${encodeURIComponent(currentPath ?? "/dashboard")}`)
  }

  // Only used to decide whether the sidebar shows admin-only links — the
  // actual route protection still lives in admin/layout.tsx, this is just
  // avoiding showing a link a plain USER can't follow.
  const isAdminTier = Boolean(await getAdminPrincipal())

  return <DashboardShell isAdminTier={isAdminTier}>{children}</DashboardShell>
}
