"use server"

import { revalidatePath } from "next/cache"

import type { ScanTier } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/auth/session"
import { ASSIGNABLE_ROLES, type AppRole } from "@/lib/dashboard/nav"
import { SCAN_TIERS } from "@/lib/models/types"
import { tokenGrantSchema } from "@/lib/onboarding/schemas"
import { prisma } from "@/lib/db/client"
import { grantTokens } from "@/lib/tokens/wallet"
import { z } from "zod"

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
  revalidatePath("/admin/tokens")
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

const scanTierSchema = z.enum(SCAN_TIERS)

export async function setUserScanTierAction(userId: string, tier: ScanTier) {
  await requireAdmin()
  scanTierSchema.parse(tier)

  await prisma.user.update({
    where: { id: userId },
    data: { scanTier: tier },
  })

  revalidatePath("/admin/users")
}
