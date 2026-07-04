"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth/session"
import { tokenGrantSchema } from "@/lib/onboarding/schemas"
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
