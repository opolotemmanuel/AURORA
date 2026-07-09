// Thin per AGENTS.md convention — chrome logic lives in OnboardingShell.
import { OnboardingShell } from "@/components/layouts/onboarding-shell"

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <OnboardingShell>{children}</OnboardingShell>
}
