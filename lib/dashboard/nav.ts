export type AppRole = "user" | "admin" | "expert" | "company_admin"

export type NavItem = {
  href: string
  label: string
  badge?: string
}

export type NavSection = {
  title: string
  items: NavItem[]
}

const OVERVIEW: NavSection = {
  title: "Overview",
  items: [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/usage", label: "Usage" },
  ],
}

const YOUR_DATA: NavSection = {
  title: "Your data",
  items: [
    { href: "/dashboard/profile", label: "Profile" },
    { href: "/reports", label: "Reports" },
    { href: "/dashboard/privacy", label: "Privacy" },
  ],
}

const ACCOUNT: NavSection = {
  title: "Account",
  items: [{ href: "/settings", label: "Settings" }],
}

const ADMIN: NavSection = {
  title: "Administration",
  items: [
    { href: "/admin", label: "Analytics" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/tokens", label: "Tokens" },
    { href: "/admin/products", label: "Products" },
  ],
}

const EXPERT: NavSection = {
  title: "Expert",
  items: [{ href: "/admin/reviews", label: "Review queue", badge: "Soon" }],
}

const ORGANIZATION: NavSection = {
  title: "Organization",
  items: [{ href: "/admin/organization", label: "Workspace", badge: "Soon" }],
}

export function getNavSections(role: AppRole): NavSection[] {
  const sections: NavSection[] = [OVERVIEW, YOUR_DATA, ACCOUNT]

  if (role === "admin" || role === "expert" || role === "company_admin") {
    if (role === "admin") {
      sections.push(ADMIN)
    }
    if (role === "expert" || role === "admin") {
      sections.push(EXPERT)
    }
    if (role === "company_admin" || role === "admin") {
      sections.push(ORGANIZATION)
    }
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

export const ASSIGNABLE_ROLES: AppRole[] = ["user", "admin", "expert", "company_admin"]
