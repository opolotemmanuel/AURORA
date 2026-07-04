import { Suspense } from "react"

import { OnboardingAuthShell } from "@/components/layouts/onboarding-auth-shell"
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-skeleton"

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingAuthShell>{children}</OnboardingAuthShell>
    </Suspense>
  )
}
