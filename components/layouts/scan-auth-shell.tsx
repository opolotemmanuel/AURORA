import { ScanShell } from "@/components/layouts/scan-shell"
import { ScanTooltipProvider } from "@/components/layouts/scan-tooltip-provider"
import { AuthShellGate } from "@/components/layouts/auth-shell-gate"
import type { ReactNode } from "react"

export async function ScanAuthShell({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <AuthShellGate>
      <ScanTooltipProvider>
        <ScanShell>{children}</ScanShell>
      </ScanTooltipProvider>
    </AuthShellGate>
  )
}
