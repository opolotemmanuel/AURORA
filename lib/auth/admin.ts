import type { AdminRole } from "@/lib/backend/types"

export type AdminPermission =
  | "admin:read"
  | "analytics:read"
  | "settings:read"
  | "settings:manage"
  | "products:read"
  | "products:manage"

export type AdminPrincipal = {
  id: string
  role: AdminRole
  authMode: "placeholder"
}

export type AdminAccess =
  | {
      allowed: true
      principal: AdminPrincipal
      permission: AdminPermission
      note: string
    }
  | {
      allowed: false
      principal: null
      permission: AdminPermission
      note: string
    }

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: ["admin:read", "analytics:read", "settings:read", "settings:manage", "products:read", "products:manage"],
  admin: ["admin:read", "analytics:read", "settings:read", "settings:manage", "products:read", "products:manage"],
  operations: ["admin:read", "analytics:read", "products:read", "products:manage"],
  privacy: ["admin:read", "analytics:read", "settings:read"],
  support: ["admin:read", "analytics:read", "products:read"],
}

export class AdminAccessError extends Error {
  constructor(readonly access: AdminAccess) {
    super(access.note)
    this.name = "AdminAccessError"
  }
}

export function getAdminPrincipal(): AdminPrincipal | null {
  if (!isPlaceholderAdminAllowed()) return null

  return {
    id: "placeholder-admin",
    role: "owner",
    authMode: "placeholder",
  }
}

export function assertAdminAccess(permission: AdminPermission = "admin:read"): AdminAccess {
  const principal = getAdminPrincipal()

  if (!principal) {
    return {
      allowed: false,
      principal: null,
      permission,
      note:
        "Admin access is blocked because real authentication is not installed and placeholder admin access is disabled.",
    }
  }

  if (!rolePermissions[principal.role].includes(permission)) {
    return {
      allowed: false,
      principal: null,
      permission,
      note: `Admin role ${principal.role} does not include ${permission}.`,
    }
  }

  return {
    allowed: true,
    principal,
    permission,
    note:
      "Admin access is using a development-only placeholder. Install better-auth before treating this as production protection.",
  }
}

export function requireAdminAccess(permission: AdminPermission = "admin:read") {
  const access = assertAdminAccess(permission)

  if (!access.allowed) {
    throw new AdminAccessError(access)
  }

  return access
}

function isPlaceholderAdminAllowed() {
  if (process.env.AURA_ALLOW_PLACEHOLDER_ADMIN === "true") return true
  return process.env.NODE_ENV !== "production"
}
