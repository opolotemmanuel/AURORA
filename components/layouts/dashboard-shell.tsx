"use client"

import { DashboardContent } from "@/components/layouts/dashboard-content"
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { AppRole } from "@/lib/dashboard/nav"

export function DashboardShell({
  children,
  role,
  userName,
  userEmail,
  userImage,
  emailVerified,
}: {
  children: React.ReactNode
  role: AppRole
  userName: string
  userEmail: string
  userImage: string | null
  emailVerified: boolean
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="h-svh overflow-hidden">
      <DashboardSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        emailVerified={emailVerified}
      />
      <SidebarInset className="min-h-0 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
          <span className="font-heading text-sm font-medium">Aura</span>
        </header>
        <DashboardContent>{children}</DashboardContent>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  )
}
