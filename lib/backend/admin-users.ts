// User-account listing (and deletion) for the admin "Users" section — a
// distinct domain from lib/backend/report-store.ts (scans/reports), so it
// gets its own module per AGENTS.md's "each domain gets its own module" rule.
import { UserRole } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"

const ADMIN_TIER_ROLES = [UserRole.OWNER, UserRole.ADMIN] as const

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return users.map((user) => ({
    id: user.id,
    name: user.name ?? undefined,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }))
}

// Used both to render the "last admin" disabled state in the UI and as the
// server-side safeguard inside deleteUserAccount below — the count must be
// taken fresh at delete time, not trusted from whatever the page rendered.
export async function countAdminTierUsers() {
  return prisma.user.count({ where: { role: { in: [...ADMIN_TIER_ROLES] } } })
}

export type DeleteUserResult =
  | { success: true; deletedUser: { id: string; name?: string; email: string; role: UserRole } }
  | { success: false; error: string }

// Permission (requireAdminAccess) is the caller's job — see
// app/(dashboard)/admin/users/user-actions.ts. This function owns the two
// business-rule safeguards (never self, never the last admin) plus the
// actual deletion, so both are enforced no matter what calls this, not just
// the one UI button that happens to call it today.
//
// Schema note: Scan.user and Report.user are `onDelete: SetNull`, not
// Cascade — deleting the User row alone would anonymize their scans/reports
// (userId -> null) rather than remove them, contradicting this feature's
// whole point ("permanently deletes their scans, reports, and chat
// history"). So this explicitly deletes the user's Scan rows first, which
// cascades to Report, ReportFinding, Recommendation, ReportChatMessage, and
// ReportDownload/AiProviderEvent (each already Cascade from Report) — then
// deletes the User row itself, which cascades AuthAccount, AuthSession,
// SkinAdviceMessage, and any remaining ReportChatMessage by userId.
export async function deleteUserAccount(input: {
  targetUserId: string
  callerId: string
}): Promise<DeleteUserResult> {
  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!target) {
    return { success: false, error: "User not found." }
  }

  if (target.id === input.callerId) {
    return { success: false, error: "You cannot delete your own account." }
  }

  if (ADMIN_TIER_ROLES.includes(target.role as (typeof ADMIN_TIER_ROLES)[number])) {
    const adminTierCount = await countAdminTierUsers()
    if (adminTierCount <= 1) {
      return { success: false, error: "Cannot delete the last remaining admin account." }
    }
  }

  await prisma.$transaction([
    prisma.scan.deleteMany({ where: { userId: target.id } }),
    prisma.user.delete({ where: { id: target.id } }),
  ])

  return {
    success: true,
    deletedUser: {
      id: target.id,
      name: target.name ?? undefined,
      email: target.email,
      role: target.role,
    },
  }
}
