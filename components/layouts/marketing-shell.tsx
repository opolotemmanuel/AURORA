// Chrome for the (marketing) route group — just the top nav; the actual
// landing page content lives in components/marketing/landing-page-content.tsx.
import { MarketingNav } from "@/components/layouts/marketing-nav"

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
