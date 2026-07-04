import { redirect } from "next/navigation"

import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { getAuthContext } from "@/lib/auth/context"

export async function DashboardAuthShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }

  if (!ctx.onboardingCompleted) {
    redirect("/onboarding")
  }

  const isImpersonating = Boolean(
    ctx.session.session &&
      "impersonatedBy" in ctx.session.session &&
      ctx.session.session.impersonatedBy,
  )

  return (
    <>
      {isImpersonating ? <ImpersonationBanner /> : null}
      <DashboardShell
        role={ctx.role}
        userName={ctx.user.name}
        userEmail={ctx.user.email}
        userImage={ctx.user.image ?? null}
        emailVerified={ctx.user.emailVerified}
      >
        {children}
      </DashboardShell>
    </>
  )
}
