// Role-based access control for the admin dashboard. This sits on top of
// better-auth sessions (see session.ts) — it doesn't do its own auth, it
// only decides what a signed-in user's DB role is allowed to do.
import type { AdminRole } from "@/lib/backend/types"
import { getSession } from "@/lib/auth/session"

export type AdminPermission =
  | "admin:read"
  | "analytics:read"
  | "users:read"
  | "users:delete"
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

// What each admin-eligible role can do. `owner` and `admin` are
// intentionally identical today — kept as separate roles because they're
// expected to diverge later (e.g. owner-only billing controls).
const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: ["admin:read", "analytics:read", "users:read", "users:delete", "settings:read", "settings:manage", "products:read", "products:manage"],
  admin: ["admin:read", "analytics:read", "users:read", "users:delete", "settings:read", "settings:manage", "products:read", "products:manage"],
  operations: ["admin:read", "analytics:read", "products:read", "products:manage"],
  // privacy and support can view the users table but not delete accounts —
  // account deletion is deliberately restricted to the two full-admin tiers.
  privacy: ["admin:read", "analytics:read", "users:read", "settings:read"],
  support: ["admin:read", "analytics:read", "users:read", "products:read"],
}

// Maps the Prisma `User.role` enum (uppercase) to the lowercase AdminRole
// used for permission lookups. Deliberately has no entry for "USER" — a
// regular user has no admin role at all, so the lookup below misses and
// getAdminPrincipal returns null.
//
// Note: AdminRole also includes "operations" (see rolePermissions above),
// but the Prisma role enum (lib/auth/auth.ts) has no matching "OPERATIONS"
// value yet, so that role is currently unreachable through a real session —
// it's reserved for when that DB role is added.
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

// Three layers, each for a different call site:
//  - getAdminPrincipal: "who is this, if anyone admin-eligible?" (nullable)
//  - assertAdminAccess: "can they do X?" (returns a reason either way)
//  - requireAdminAccess: same check, but throws so route handlers can just
//    await it and not worry about the negative case
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
