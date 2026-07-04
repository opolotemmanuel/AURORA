import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { auth } from "@/lib/auth/server"
import { getOnboardingStatus } from "@/lib/auth/session"
import type { AppRole } from "@/lib/dashboard/nav"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/login")
  }

  const { completed } = await getOnboardingStatus(session.user.id)
  if (!completed) {
    redirect("/onboarding")
  }

  const role = ((session.user as { role?: string }).role ?? "user") as AppRole
  const isImpersonating = Boolean(
    session.session &&
      "impersonatedBy" in session.session &&
      session.session.impersonatedBy
  )

  return (
    <>
      {isImpersonating ? <ImpersonationBanner /> : null}
      <DashboardShell
        role={role}
        userName={session.user.name}
        userEmail={session.user.email}
      >
        {children}
      </DashboardShell>
    </>
  )
}
