import { MarketingDockGate } from "@/components/marketing/marketing-dock-gate"

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <MarketingDockGate />
    </div>
  )
}
