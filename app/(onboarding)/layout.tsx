// Thin per AGENTS.md convention — chrome logic lives in OnboardingShell.
// Gates the whole (onboarding) group behind a signed-in session, same
// pattern as app/(dashboard)/layout.tsx and app/(scan)/layout.tsx — newly
// added here since onboarding/consent now performs a real, user-scoped
// write (recording scanConsentGivenAt), not just static placeholder copy.
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CURRENT_PATH_HEADER } from "@/proxy"
import { AuthUnavailable } from "@/components/auth/auth-unavailable"
import { OnboardingShell } from "@/components/layouts/onboarding-shell"
import { resolveSession } from "@/lib/auth/resolve-session"

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const result = await resolveSession()

  if (result.status === "db_unavailable") {
    return <AuthUnavailable />
  }

  if (result.status === "none") {
    const currentPath = (await headers()).get(CURRENT_PATH_HEADER)
    redirect(`/login?callbackURL=${encodeURIComponent(currentPath ?? "/onboarding/consent")}`)
  }

  return <OnboardingShell>{children}</OnboardingShell>
}
