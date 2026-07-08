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
