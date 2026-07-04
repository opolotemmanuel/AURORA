import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  getNavSections,
  getRoleLabel,
  type AppRole,
} from "@/lib/dashboard/nav"

export function DashboardSidebar({
  pathname,
  role,
  userName,
  userEmail,
}: {
  pathname: string
  role: AppRole
  userName: string
  userEmail: string
}) {
  const sections = getNavSections(role)

  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="font-heading text-sm font-medium tracking-wide">
          Aura
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ||
                    (item.href === "/dashboard" && pathname === "/dashboard")

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                      >
                        <span>{item.label}</span>
                        {item.badge ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
                          >
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-sm font-medium">{userName || "Member"}</p>
        <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{getRoleLabel(role)}</p>
      </div>
    </aside>
  )
}
