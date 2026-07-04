"use client"

import { usePathname } from "next/navigation"

import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar"
import type { AppRole } from "@/lib/dashboard/nav"

export function DashboardShell({
  children,
  role,
  userName,
  userEmail,
}: {
  children: React.ReactNode
  role: AppRole
  userName: string
  userEmail: string
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-svh bg-background">
      <DashboardSidebar
        pathname={pathname}
        role={role}
        userName={userName}
        userEmail={userEmail}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  )
}
