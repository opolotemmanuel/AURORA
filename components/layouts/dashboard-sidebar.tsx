import Link from "next/link"
import {
  IconLayoutDashboard,
  IconLeaf,
  IconReportAnalytics,
  IconSettings,
  IconShieldLock,
  IconUserCircle,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"

// Shown to every signed-in user regardless of role.
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/reports", label: "Reports", icon: IconReportAnalytics },
  { href: "/profile", label: "Profile", icon: IconUserCircle },
] as const

// `/settings` is the admin product-catalog/enterprise-settings page (see
// app/(dashboard)/settings/page.tsx's requireAdminAccess("settings:manage")
// gate) — not a user account-settings page — so it's admin-only nav, same
// tier as Admin. Previously shown to every user, which meant every regular
// USER saw a "Settings" link that only ever dead-ended in Access Denied.
const ADMIN_ONLY_ITEMS = [
  { href: "/settings", label: "Settings", icon: IconSettings },
  { href: "/admin", label: "Admin", icon: IconShieldLock },
] as const

// `pathname` is passed in (rather than read here via usePathname) so this
// stays a plain component the parent shell controls, matching-prefix logic
// below keeps e.g. /reports/123 highlighting the /reports nav item.
// `isAdminTier` hides admin-only links for plain USER accounts — the real
// route protection is still lib/auth/admin.ts's requireAdminAccess, this
// just avoids showing a link they can't follow.
export function DashboardSidebar({ pathname, isAdminTier }: { pathname: string; isAdminTier: boolean }) {
  const items = isAdminTier ? [...navItems, ...ADMIN_ONLY_ITEMS] : navItems

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-6">
        <IconLeaf className="size-5 text-primary" />
        <Link href="/dashboard" className="font-heading text-sm font-medium tracking-wide">
          Aura
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  )
}
