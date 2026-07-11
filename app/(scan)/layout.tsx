// Thin per AGENTS.md convention — chrome logic lives in ScanShell. Also
// gates the whole (scan) group behind a signed-in session, same pattern as
// app/(dashboard)/layout.tsx.
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CURRENT_PATH_HEADER } from "@/proxy"
import { ScanShell } from "@/components/layouts/scan-shell"
import { getSession } from "@/lib/auth/session"

export default async function ScanLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session) {
    // Only reached if a stale/invalid session cookie passed proxy's cheap
    // presence check but fails this real one — same callbackURL round-trip
    // as proxy's own redirect.
    const currentPath = (await headers()).get(CURRENT_PATH_HEADER)
    redirect(`/login?callbackURL=${encodeURIComponent(currentPath ?? "/dashboard")}`)
  }

  return <ScanShell>{children}</ScanShell>
}
