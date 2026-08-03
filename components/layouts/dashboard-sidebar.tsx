"use client"

// Main app sidebar — icon rail (bar 1) → contextual item list (bar 2) →
// page content (bar 3, rendered by dashboard-shell.tsx as {children}),
// same 3-column pattern already built and verified for the Enterprise
// Settings console (components/admin/settings/settings-tabs.tsx). One key
// difference from that console: there's no client-side Tabs/TabsContent
// here, because bar 3 across this whole app is real Next.js routing, not
// one page's client-switched panels — every item below is a genuine
// <Link>, and every href/label/icon/admin-gating rule is copied unchanged
// from the pre-restructure NAV_SECTIONS/ADMINISTRATION_SECTION (now in
// sidebar-nav-config.ts). This file owns both the desktop layout and the
// mobile header/Sheet — dashboard-shell.tsx just renders this once plus
// <main>.
import { useEffect, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth/client"
import { AuroraLogomark } from "@/components/brand/aurora-logomark"
import { SidebarProfileMenu } from "@/components/layouts/sidebar-profile-menu"
import {
  SIDEBAR_CATEGORIES,
  findActiveCategory,
  isNavItemActive,
  type SidebarCategoryId,
  type SidebarNavItem,
} from "@/components/layouts/sidebar-nav-config"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

// `isAdminTier` hides the Administration category for plain USER accounts
// — the real route protection is still each /admin/* and /settings page's
// own requireAdminAccess call; this only avoids showing links a plain
// user can't follow, same purpose (and same source data) the old
// conditional `[...NAV_SECTIONS, ADMINISTRATION_SECTION]` spread served.
export function DashboardSidebar({ pathname, isAdminTier }: { pathname: string; isAdminTier: boolean }) {
  const { data: session } = authClient.useSession()
  const visibleCategories = isAdminTier ? SIDEBAR_CATEGORIES : SIDEBAR_CATEGORIES.filter((category) => !category.adminOnly)

  // Which category's item list bar 2 (and the mobile Sheet) currently
  // shows. Clicking a rail icon browses a category without navigating —
  // manualCategory holds that override. Actually navigating (pathname
  // changing) always wins: the effect below clears the override so the
  // list snaps back to reflect wherever the user actually landed, per
  // this task's "don't always reset to Overview" requirement.
  const [manualCategory, setManualCategory] = useState<SidebarCategoryId | null>(null)
  const [mobileListOpen, setMobileListOpen] = useState(false)

  useEffect(() => {
    setManualCategory(null)
  }, [pathname])

  const routeCategory = findActiveCategory(pathname, visibleCategories)
  const displayedCategory = manualCategory ?? routeCategory
  const displayedCategoryMeta = visibleCategories.find((category) => category.id === displayedCategory)
  const displayedItems = displayedCategoryMeta?.items ?? []

  function openCategoryOnMobile(category: SidebarCategoryId) {
    setManualCategory(category)
    setMobileListOpen(true)
  }

  return (
    <>
      {/* Desktop: fixed rail + contextual list, hidden below lg (see the
          mobile header below for the lg:hidden equivalent). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden lg:flex">
        <nav className="flex w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-3">
          <Link
            href="/dashboard"
            aria-label="Aurora Organics home"
            className="mb-2 grid size-10 shrink-0 place-items-center rounded-md transition-colors hover:bg-sidebar-accent"
          >
            <AuroraLogomark className="size-7" />
          </Link>

          <div className="flex flex-1 flex-col items-center gap-1">
            {visibleCategories.map((category) => {
              const Icon = category.icon
              const isActive = category.id === displayedCategory

              return (
                <button
                  key={category.id}
                  type="button"
                  title={category.label}
                  aria-label={category.label}
                  aria-pressed={isActive}
                  onClick={() => setManualCategory(category.id)}
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </button>
              )
            })}
          </div>

          {session ? <SidebarProfileMenu user={session.user} popoutSide="top" /> : null}
        </nav>

        <div className="flex w-56 flex-col border-r border-border bg-background">
          <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {displayedCategoryMeta?.label}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CategoryItemList items={displayedItems} pathname={pathname} />
          </div>
        </div>
      </aside>

      {/* Mobile: sticky header with the same rail icons laid out
          horizontally — tapping one opens a Sheet with that category's
          items (same Sheet primitive already used for the Settings
          console's mobile collapse); selecting an item closes the Sheet
          and navigates. */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-border bg-background px-3 lg:hidden">
        <Link href="/dashboard" aria-label="Aurora Organics home" className="mr-1 grid size-9 shrink-0 place-items-center">
          <AuroraLogomark className="size-6" />
        </Link>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {visibleCategories.map((category) => {
            const Icon = category.icon
            const isActive = category.id === displayedCategory

            return (
              <button
                key={category.id}
                type="button"
                aria-label={category.label}
                onClick={() => openCategoryOnMobile(category.id)}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md transition-colors",
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>

        {session ? <SidebarProfileMenu user={session.user} popoutSide="bottom" /> : null}
      </header>

      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border px-4 py-3 text-left">
            <SheetTitle className="text-sm">{displayedCategoryMeta?.label}</SheetTitle>
          </SheetHeader>
          <CategoryItemList items={displayedItems} pathname={pathname} onSelect={() => setMobileListOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

// Shared vertical item list — desktop's bar 2 and the mobile Sheet both
// render this against whichever category is currently displayed, so the
// two surfaces can't drift into different labels/hrefs/active-styling.
// Same active-highlight rule and classNames the old flat single-list
// sidebar used per item — only the surrounding structure (grouped by
// category, shown one category at a time) changed.
function CategoryItemList({
  items,
  pathname,
  onSelect,
}: {
  items: SidebarNavItem[]
  pathname: string
  onSelect?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onSelect}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
