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
