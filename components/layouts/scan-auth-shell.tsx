import { ScanShell } from "@/components/layouts/scan-shell"
import { AuthShellGate } from "@/components/layouts/auth-shell-gate"
import type { ReactNode } from "react"

export async function ScanAuthShell({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <AuthShellGate>
      <ScanShell>{children}</ScanShell>
    </AuthShellGate>
  )
}
