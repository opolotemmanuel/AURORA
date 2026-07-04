"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconCheck } from "@tabler/icons-react"

import {
  SidebarNavItem,
  SidebarNavLayoutGroup,
} from "@/components/layouts/dashboard-sidebar-nav-item"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  getNavSections,
  getRoleLabel,
  type AppRole,
} from "@/lib/dashboard/nav"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  )
}

function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`)) ||
    (href === "/dashboard" && pathname === "/dashboard")
  )
}

function SidebarUserFooter({
  role,
  userName,
  userEmail,
  userImage,
  emailVerified,
}: {
  role: AppRole
  userName: string
  userEmail: string
  userImage: string | null
  emailVerified: boolean
}) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent/50",
          collapsed && "justify-center p-1",
        )}
      >
        <Avatar size={collapsed ? "default" : "lg"}>
          <AvatarImage src={userImage ?? undefined} alt={userName || "Member"} />
          <AvatarFallback>{initials(userName || userEmail)}</AvatarFallback>
          {emailVerified ? (
            <AvatarBadge>
              <IconCheck className="size-2" />
            </AvatarBadge>
          ) : null}
        </Avatar>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {userName || "Member"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {getRoleLabel(role)}
            </p>
          </div>
        ) : null}
      </div>
    </SidebarFooter>
  )
}

export function DashboardSidebar({
  role,
  userName,
  userEmail,
  userImage,
  emailVerified,
}: {
  role: AppRole
  userName: string
  userEmail: string
  userImage: string | null
  emailVerified: boolean
}) {
  const pathname = usePathname()
  const sections = getNavSections(role)

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center px-3">
          <Link
            href="/dashboard"
            className="font-heading truncate text-sm font-medium tracking-wide"
          >
            Aura
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavLayoutGroup>
          {sections.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      badge={item.badge}
                      isActive={isNavItemActive(pathname, item.href)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarNavLayoutGroup>
      </SidebarContent>

      <SidebarUserFooter
        role={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        emailVerified={emailVerified}
      />
      <SidebarRail />
    </Sidebar>
  )
}
