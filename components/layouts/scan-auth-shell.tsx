import { redirect } from "next/navigation"

import { ScanShell } from "@/components/layouts/scan-shell"
import { getAuthContext } from "@/lib/auth/context"

export async function ScanAuthShell({
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
  return <ScanShell>{children}</ScanShell>
}
