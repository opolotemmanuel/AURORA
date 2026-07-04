import { redirect } from "next/navigation"

import { OnboardingShell } from "@/components/layouts/onboarding-shell"
import { getSession, getOnboardingStatus } from "@/lib/auth/session"

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const { completed } = await getOnboardingStatus(session.user.id)
  if (completed) {
    redirect("/dashboard")
  }

  return <OnboardingShell>{children}</OnboardingShell>
}
