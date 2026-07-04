import { ScanShell } from "@/components/layouts/scan-shell"
import { requireOnboardingComplete } from "@/lib/auth/session"

export default async function ScanLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireOnboardingComplete()
  return <ScanShell>{children}</ScanShell>
}
