import Link from "next/link"
import {
  IconLayoutDashboard,
  IconLeaf,
  IconReportAnalytics,
  IconSettings,
  IconShieldLock,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/reports", label: "Reports", icon: IconReportAnalytics },
  { href: "/settings", label: "Settings", icon: IconSettings },
  { href: "/admin", label: "Admin", icon: IconShieldLock },
] as const

export function DashboardSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-6">
        <IconLeaf className="size-5 text-primary" />
        <Link href="/dashboard" className="font-heading text-sm font-medium tracking-wide">
          Aura
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
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
