// Thin per AGENTS.md convention — chrome logic lives in ScanShell. Also
// gates the whole (scan) group behind a signed-in session, same pattern as
// app/(dashboard)/layout.tsx.
import { redirect } from "next/navigation"

import { ScanShell } from "@/components/layouts/scan-shell"
import { getSession } from "@/lib/auth/session"

export default async function ScanLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return <ScanShell>{children}</ScanShell>
}
