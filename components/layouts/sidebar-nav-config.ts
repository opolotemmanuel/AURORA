// Shared category/item metadata for the main app sidebar's 3-column shell
// (dashboard-sidebar.tsx) — same rail/contextual-list pattern as
// components/admin/settings/settings-nav-config.ts, adapted for real
// Next.js routes instead of client-side tab panels. Every href/label/icon
// here is copied unchanged from the pre-restructure NAV_SECTIONS/
// ADMINISTRATION_SECTION — this file only adds the category grouping and
// rail icons on top; no route, label, or permission changed.
import type { ComponentType } from "react"
import {
  IconChartBar,
  IconChartLine,
  IconDatabase,
  IconFileAnalytics,
  IconFlower,
  IconLayoutDashboard,
  IconPhotoScan,
  IconReportAnalytics,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconSparkles,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react"

export type SidebarCategoryId = "overview" | "your-data" | "account" | "administration"

export type SidebarNavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> }

export type SidebarCategory = {
  id: SidebarCategoryId
  label: string
  icon: ComponentType<{ className?: string }>
  items: SidebarNavItem[]
  // Administration only — the real route protection is still
  // lib/auth/admin.ts's requireAdminAccess on each /admin/* and /settings
  // page; this only controls whether the category/its rail icon render at
  // all, same purpose the old ADMINISTRATION_SECTION conditional spread
  // served.
  adminOnly?: true
}

export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    id: "overview",
    label: "Overview",
    icon: IconLayoutDashboard,
    items: [
      { href: "/dashboard", label: "Home", icon: IconLayoutDashboard },
      { href: "/usage", label: "Usage", icon: IconChartBar },
    ],
  },
  {
    id: "your-data",
    label: "Your Data",
    icon: IconDatabase,
    items: [
      { href: "/profile", label: "Profile", icon: IconUserCircle },
      { href: "/reports", label: "Reports", icon: IconReportAnalytics },
      { href: "/skin-history", label: "Skin History", icon: IconChartLine },
      { href: "/skin-advice", label: "Skin advice", icon: IconSparkles },
      { href: "/dosha-assessment", label: "Dosha Assessment", icon: IconFlower },
      { href: "/privacy", label: "Privacy", icon: IconShieldCheck },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: IconSettings,
    // Labeled "Settings" to match the product design, but routes to
    // /account — /settings is the separate, pre-existing admin-only
    // Enterprise Settings page (see the administration category below);
    // reusing that route here would re-create the exact bug it was split
    // off to fix.
    items: [{ href: "/account", label: "Settings", icon: IconSettings }],
  },
  {
    id: "administration",
    label: "Administration",
    icon: IconShieldLock,
    adminOnly: true,
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: IconChartBar },
      { href: "/admin/users", label: "Users", icon: IconUsers },
      { href: "/admin/scans", label: "Scans", icon: IconPhotoScan },
      { href: "/settings", label: "Enterprise Settings", icon: IconFileAnalytics },
    ],
  },
]

export const DEFAULT_SIDEBAR_CATEGORY: SidebarCategoryId = "overview"

// Same match rule the old flat sidebar used per-item (pathname === href, or
// a sub-route like /reports/123 under /reports) — reused here to also
// decide which category's rail icon should read as active, which the old
// single-level nav never needed to compute.
function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function findActiveCategory(pathname: string, categories: SidebarCategory[]): SidebarCategoryId {
  const match = categories.find((category) => category.items.some((item) => isItemActive(pathname, item.href)))
  return match?.id ?? DEFAULT_SIDEBAR_CATEGORY
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return isItemActive(pathname, href)
}
