// Chrome for the (marketing) route group — a floating dock (bottom-anchored,
// scroll-aware) instead of a top navbar, matching wyasyn/aura's review
// branch landing page design. Gated to specific paths by MarketingDockGate,
// not rendered unconditionally here, since it's meant for the
// section-scrolling landing experience, not every marketing page.
import { MarketingDockGate } from "@/components/marketing/marketing-dock-gate"

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <MarketingDockGate />
    </div>
  )
}
