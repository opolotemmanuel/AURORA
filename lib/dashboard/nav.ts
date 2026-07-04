import type { TablerIcon } from "@tabler/icons-react"
import {
  IconBuilding,
  IconChartBar,
  IconClipboardCheck,
  IconCoin,
  IconHome,
  IconLock,
  IconPackage,
  IconReport,
  IconSettings,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

export type AppRole = "user" | "admin" | "expert" | "company_admin"

export type NavItem = {
  href: string
  label: string
  icon: TablerIcon
  badge?: string
}

export type NavSection = {
  title: string
  items: NavItem[]
}

const OVERVIEW: NavSection = {
  title: "Overview",
  items: [
    { href: "/dashboard", label: "Home", icon: IconHome },
    { href: "/dashboard/usage", label: "Usage", icon: IconChartBar },
  ],
}

const YOUR_DATA: NavSection = {
  title: "Your data",
  items: [
    { href: "/dashboard/profile", label: "Profile", icon: IconUser },
    { href: "/reports", label: "Reports", icon: IconReport },
    { href: "/dashboard/privacy", label: "Privacy", icon: IconLock },
  ],
}

const ACCOUNT: NavSection = {
  title: "Account",
  items: [{ href: "/settings", label: "Settings", icon: IconSettings }],
}

const ADMIN: NavSection = {
  title: "Administration",
  items: [
    { href: "/admin", label: "Analytics", icon: IconChartBar },
    { href: "/admin/users", label: "Users", icon: IconUsers },
    { href: "/admin/tokens", label: "Tokens", icon: IconCoin },
    { href: "/admin/products", label: "Products", icon: IconPackage },
  ],
}

const EXPERT: NavSection = {
  title: "Expert",
  items: [
    {
      href: "/admin/reviews",
      label: "Review queue",
      icon: IconClipboardCheck,
      badge: "Soon",
    },
  ],
}

const ORGANIZATION: NavSection = {
  title: "Organization",
  items: [
    {
      href: "/admin/organization",
      label: "Workspace",
      icon: IconBuilding,
      badge: "Soon",
    },
  ],
}

export function canSeeAdminNav(role: AppRole): boolean {
  return role === "admin"
}

export function getNavSections(role: AppRole): NavSection[] {
  const sections: NavSection[] = [OVERVIEW, YOUR_DATA, ACCOUNT]

  if (canSeeAdminNav(role)) {
    sections.push(ADMIN)
  }

  if (role === "expert" || role === "admin") {
    sections.push(EXPERT)
  }

  if (role === "company_admin" || role === "admin") {
    sections.push(ORGANIZATION)
  }

  return sections
}

export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case "admin":
      return "Platform admin"
    case "expert":
      return "Expert"
    case "company_admin":
      return "Company admin"
    default:
      return "Member"
  }
}

export const ASSIGNABLE_ROLES: AppRole[] = [
  "user",
  "admin",
  "expert",
  "company_admin",
]
