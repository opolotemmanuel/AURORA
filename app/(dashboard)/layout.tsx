import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { auth } from "@/lib/auth/server"
import { getOnboardingStatus } from "@/lib/auth/session"

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

  const sessionData = await auth.api.getSession({
    headers: await headers(),
  })

  const isImpersonating = Boolean(
    sessionData?.session && "impersonatedBy" in sessionData.session && sessionData.session.impersonatedBy
  )

  return (
    <>
      {isImpersonating ? <ImpersonationBanner /> : null}
      <DashboardShell>{children}</DashboardShell>
    </>
  )
}
