import { redirect } from "next/navigation"

import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { getDashboardLayoutContext } from "@/lib/auth/dashboard-context"
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

  const { completed, role } = await getDashboardLayoutContext(session.user.id)

  if (!completed) {
    redirect("/onboarding")
  }

  const isImpersonating = Boolean(
    session.session &&
      "impersonatedBy" in session.session &&
      session.session.impersonatedBy,
  )

  return (
    <>
      {isImpersonating ? <ImpersonationBanner /> : null}
      <DashboardShell
        role={role}
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image ?? null}
        emailVerified={session.user.emailVerified}
      >
        {children}
      </DashboardShell>
    </>
  )
}
