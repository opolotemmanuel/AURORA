import type { AdminRole } from "@/lib/backend/types"
import { getSession } from "@/lib/auth/session"

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
  authMode: "session"
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

const dbRoleToAdminRole: Record<string, AdminRole> = {
  OWNER: "owner",
  ADMIN: "admin",
  SUPPORT: "support",
  PRIVACY: "privacy",
}

export class AdminAccessError extends Error {
  constructor(readonly access: AdminAccess) {
    super(access.note)
    this.name = "AdminAccessError"
  }
}

export async function getAdminPrincipal(): Promise<AdminPrincipal | null> {
  const session = await getSession()
  if (!session) return null

  const role = dbRoleToAdminRole[session.user.role]
  if (!role) return null

  return { id: session.user.id, role, authMode: "session" }
}

export async function assertAdminAccess(permission: AdminPermission = "admin:read"): Promise<AdminAccess> {
  const principal = await getAdminPrincipal()

  if (!principal) {
    return {
      allowed: false,
      principal: null,
      permission,
      note: "Admin access requires a signed-in user with an admin-eligible role.",
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
    note: "Admin access granted from the signed-in user's role.",
  }
}

export async function requireAdminAccess(permission: AdminPermission = "admin:read") {
  const access = await assertAdminAccess(permission)

  if (!access.allowed) {
    throw new AdminAccessError(access)
  }

  return access
}
