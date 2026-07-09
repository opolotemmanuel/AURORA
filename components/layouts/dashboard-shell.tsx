"use client"

// Chrome for the (dashboard) route group (user + admin) — fixed sidebar +
// main content. Client component only because it needs the current
// pathname to highlight the active sidebar link.
import { usePathname } from "next/navigation"

import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    // pl-56 reserves space for the sidebar, which is `fixed` (see
    // dashboard-sidebar.tsx) rather than in normal flow.
    <div className="min-h-svh bg-background pl-56">
      <DashboardSidebar pathname={pathname} />
      <main className="min-h-svh p-8">{children}</main>
    </div>
  )
}
