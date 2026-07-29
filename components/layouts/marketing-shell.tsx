import { MarketingNavbar } from "@/components/marketing/marketing-navbar"

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingNavbar />
      {/* Offsets the fixed navbar so page content never starts underneath it. */}
      <main className="flex-1 pt-16">{children}</main>
    </div>
  )
}
