// Thin per AGENTS.md convention — chrome logic lives in ScanShell. Also
// gates the whole (scan) group behind a signed-in session, same pattern as
// app/(dashboard)/layout.tsx.
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CURRENT_PATH_HEADER } from "@/proxy"
import { AuthUnavailable } from "@/components/auth/auth-unavailable"
import { ScanShell } from "@/components/layouts/scan-shell"
import { resolveSession } from "@/lib/auth/resolve-session"

export default async function ScanLayout({
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
    // as proxy's own redirect.
    const currentPath = (await headers()).get(CURRENT_PATH_HEADER)
    redirect(`/login?callbackURL=${encodeURIComponent(currentPath ?? "/dashboard")}`)
  }

  return <ScanShell>{children}</ScanShell>
}
