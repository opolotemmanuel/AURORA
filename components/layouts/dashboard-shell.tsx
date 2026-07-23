"use client"

// Chrome for the (dashboard) route group (user + admin). Desktop (`lg` and
// up): fixed sidebar + main content, unchanged from before mobile support
// existed. Below `lg`: the fixed sidebar hides itself (see
// dashboard-sidebar.tsx's DashboardSidebar) and this renders a slim sticky
// header with a menu button instead, opening the exact same nav content in
// a Sheet drawer — same primitive already used for the report/skin-advice
// chat panels, rather than hand-rolling a second responsive mechanism.
import { useState } from "react"
import { usePathname } from "next/navigation"
import { IconLeaf, IconMenu2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DashboardSidebar, SidebarNavContent } from "@/components/layouts/dashboard-sidebar"

export function DashboardShell({
  children,
  isAdminTier,
}: {
  children: React.ReactNode
  isAdminTier: boolean
}) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    // lg:pl-56 reserves space for the fixed desktop sidebar only at `lg` and
    // up — below that the sidebar is hidden (not squeezed into a sliver),
    // so no left padding is needed and none is applied.
    <div className="min-h-svh bg-background lg:pl-56">
      <DashboardSidebar pathname={pathname} isAdminTier={isAdminTier} />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <IconMenu2 className="size-4" />
            </Button>
          </SheetTrigger>
          <IconLeaf className="size-5 text-primary" />
          <span className="font-heading text-sm font-medium tracking-wide">Aura</span>
        </header>

        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNavContent
            pathname={pathname}
            isAdminTier={isAdminTier}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <main className="min-h-svh p-4 sm:p-8">{children}</main>
    </div>
  )
}
