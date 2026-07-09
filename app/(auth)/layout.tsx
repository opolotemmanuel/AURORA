// Thin per AGENTS.md convention — chrome logic lives in AuthShell.
import { AuthShell } from "@/components/layouts/auth-shell"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AuthShell>{children}</AuthShell>
}
