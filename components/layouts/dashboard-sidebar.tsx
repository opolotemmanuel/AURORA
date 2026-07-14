"use client"

import Image from "next/image"
import Link from "next/link"
import {
  IconChartBar,
  IconChartLine,
  IconFileAnalytics,
  IconFlower,
  IconLayoutDashboard,
  IconLeaf,
  IconPhotoScan,
  IconReportAnalytics,
  IconSettings,
  IconShieldCheck,
  IconSparkles,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth/client"

type NavItem = { href: string; label: string; icon: typeof IconLayoutDashboard }
type NavSection = { label: string; items: NavItem[] }

// Shown to every signed-in user regardless of role. Grouped to match the
// Overview / Your Data / Account structure from the product's sidebar design.
const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Home", icon: IconLayoutDashboard },
      { href: "/usage", label: "Usage", icon: IconChartBar },
    ],
  },
  {
    label: "Your Data",
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
    label: "Account",
    // Labeled "Settings" to match the product design, but routes to
    // /account — /settings is a separate, pre-existing admin-only page
    // (product catalog / enterprise settings, see ADMINISTRATION_SECTION
    // below) and reusing that route here would re-create the exact bug it
    // was split off to fix (see ADMINISTRATION_SECTION's comment).
    items: [{ href: "/account", label: "Settings", icon: IconSettings }],
  },
]

// `/settings` is the admin product-catalog/enterprise-settings page (see
// app/(dashboard)/settings/page.tsx's requireAdminAccess("settings:manage")
// gate) — not a user account-settings page — so it's admin-only nav, same
// tier as the rest of this group. Previously shown to every user, which
// meant every regular USER saw a "Settings" link that only ever dead-ended
// in Access Denied. Labeled "Enterprise Settings" here (rather than plain
// "Settings") so it doesn't collide with the user-facing "Settings" link
// above for admins, who see both.
//
// /admin used to be a single link to one page holding analytics, a scan/
// report table, and system status all at once — split into three admin/*
// routes (Analytics/Users/Scans) so each is its own focused page, same
// admin-gating (admin/layout.tsx's requireAdminAccess) either way.
const ADMINISTRATION_SECTION: NavSection = {
  label: "Administration",
  items: [
    { href: "/admin/analytics", label: "Analytics", icon: IconChartBar },
    { href: "/admin/users", label: "Users", icon: IconUsers },
    { href: "/admin/scans", label: "Scans", icon: IconPhotoScan },
    { href: "/settings", label: "Enterprise Settings", icon: IconFileAnalytics },
  ],
}

// `pathname` is passed in (rather than read here via usePathname) so this
// stays a plain component the parent shell controls, matching-prefix logic
// below keeps e.g. /reports/123 highlighting the /reports nav item.
// `isAdminTier` hides admin-only links for plain USER accounts — the real
// route protection is still lib/auth/admin.ts's requireAdminAccess, this
// just avoids showing a link they can't follow.
export function DashboardSidebar({ pathname, isAdminTier }: { pathname: string; isAdminTier: boolean }) {
  const sections = isAdminTier ? [...NAV_SECTIONS, ADMINISTRATION_SECTION] : NAV_SECTIONS
  const { data: session } = authClient.useSession()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-6">
        <IconLeaf className="size-5 text-primary" />
        <Link href="/dashboard" className="font-heading text-sm font-medium tracking-wide">
          Aura
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {section.label}
            </p>
            {section.items.map((item) => {
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
          </div>
        ))}
      </nav>

      {session ? (
        <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <IconUserCircle className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {session.user.name || "Aura user"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
