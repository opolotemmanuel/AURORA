// Thin per AGENTS.md convention — chrome logic lives in MarketingShell.
import { MarketingShell } from "@/components/layouts/marketing-shell"

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <MarketingShell>{children}</MarketingShell>
}
