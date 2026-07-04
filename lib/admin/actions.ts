"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth/session"
import { ASSIGNABLE_ROLES, type AppRole } from "@/lib/dashboard/nav"
import { tokenGrantSchema } from "@/lib/onboarding/schemas"
import { prisma } from "@/lib/db/client"
import { grantTokens } from "@/lib/tokens/wallet"

export async function grantAdminTokensAction(input: unknown) {
  const session = await requireAdmin()
  const data = tokenGrantSchema.parse(input)

  await grantTokens({
    userId: data.userId,
    amount: data.amount,
    reason: "admin_grant",
    grantedById: session.user.id,
    metadata: data.reason ? { reason: data.reason } : undefined,
  })

  revalidatePath("/admin")
}

export async function setUserRoleAction(userId: string, role: AppRole) {
  await requireAdmin()
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new Error("Invalid role")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath("/admin/users")
}
