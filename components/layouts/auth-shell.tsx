// Chrome for the (auth) route group (login/register/forgot/reset) — split
// screen on desktop (hero left, form right), stacked hero-on-top on mobile
// (see AGENTS.md's route-group table and the auth spec's layout section).
import { HeroPanel } from "@/components/auth/hero-panel"

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-3xl border border-border shadow-xl lg:grid-cols-[48%_52%]">
        <HeroPanel />
        <div className="flex items-center bg-card p-6 md:p-12 lg:p-16">
          <div className="w-full space-y-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
