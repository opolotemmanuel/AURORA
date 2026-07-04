import { redirect } from "next/navigation"

import { OnboardingShell } from "@/components/layouts/onboarding-shell"
import { getOnboardingContext } from "@/lib/onboarding/context"

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const context = await getOnboardingContext()
  if (!context) {
    redirect("/login")
  }

  if (context.completed) {
    redirect("/dashboard")
  }

  return <OnboardingShell>{children}</OnboardingShell>
}
