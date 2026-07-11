import { ScanShell } from "@/components/layouts/scan-shell"
import { ScanTooltipProvider } from "@/components/layouts/scan-tooltip-provider"
import { AuthShellGate, getResolvedAuthContext } from "@/components/layouts/auth-shell-gate"
import { scheduleAiScanContextWarmup } from "@/lib/ai/context/warm"
import type { ReactNode } from "react"

export async function ScanAuthShell({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <AuthShellGate>
      <ScanAuthShellInner>{children}</ScanAuthShellInner>
    </AuthShellGate>
  )
}

async function ScanAuthShellInner({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const ctx = await getResolvedAuthContext()
  if (ctx) {
    scheduleAiScanContextWarmup(ctx.userId)
  }

  return (
    <ScanTooltipProvider>
      <ScanShell>{children}</ScanShell>
    </ScanTooltipProvider>
  )
}
