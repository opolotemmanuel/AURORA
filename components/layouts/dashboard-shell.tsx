"use client"

import { usePathname } from "next/navigation"

import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-svh bg-background pl-56">
      <DashboardSidebar pathname={pathname} />
      <main className="min-h-svh p-8">{children}</main>
    </div>
  )
}
