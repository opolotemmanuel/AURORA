"use client"

// Chrome for the (dashboard) route group (user + admin). DashboardSidebar
// now owns both the desktop rail+list layout and the mobile sticky-
// header/Sheet responsive behavior internally (3-column pattern, same
// approach as the Enterprise Settings console) — this shell just mounts
// it once and reserves the matching layout space for bar 3.
import { usePathname } from "next/navigation"

import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar"

export function DashboardShell({
  children,
  isAdminTier,
}: {
  children: React.ReactNode
  isAdminTier: boolean
}) {
  const pathname = usePathname()

  return (
    // lg:pl-72 reserves space for the fixed desktop rail (w-16) + item
    // list (w-56) only at `lg` and up — below that both collapse into the
    // sticky mobile header instead, so no left padding is needed there.
    <div className="min-h-svh bg-background lg:pl-72">
      <DashboardSidebar pathname={pathname} isAdminTier={isAdminTier} />

      <main className="min-h-svh p-4 sm:p-8">{children}</main>
    </div>
  )
}
