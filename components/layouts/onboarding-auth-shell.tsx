import { redirect } from "next/navigation"

import { OnboardingShell } from "@/components/layouts/onboarding-shell"
import { getAuthContext } from "@/lib/auth/context"
import { getOnboardingContext } from "@/lib/onboarding/context"

export async function OnboardingAuthShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }

  if (ctx.onboardingCompleted) {
    redirect("/dashboard")
  }

  const context = await getOnboardingContext()
  if (!context) {
    redirect("/login")
  }

  return <OnboardingShell>{children}</OnboardingShell>
}
