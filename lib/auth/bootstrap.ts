import { prisma } from "@/lib/db/client"
import { getSignupTokenBonus } from "@/lib/onboarding/constants"
import { grantTokens } from "@/lib/tokens/wallet"

export async function ensureUserRecords(userId: string, email: string, name?: string) {
  await Promise.all([
    prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
    prisma.userLocation.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
    prisma.tokenWallet.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    }),
  ])

  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase()
  const updates: Promise<unknown>[] = []

  if (bootstrapEmail && email.toLowerCase() === bootstrapEmail) {
    updates.push(
      prisma.user.update({
        where: { id: userId },
        data: { role: "admin" },
      }),
    )
  }

  if (name) {
    updates.push(
      prisma.user.update({
        where: { id: userId },
        data: { name },
      }),
    )
  }

  if (updates.length > 0) {
    await Promise.all(updates)
  }
}

export async function grantSignupBonusIfNeeded(userId: string) {
  const existing = await prisma.tokenLedger.findFirst({
    where: { userId, reason: "signup_bonus" },
  })
  if (existing) return

  await grantTokens({
    userId,
    amount: getSignupTokenBonus(),
    reason: "signup_bonus",
    metadata: { note: "Welcome bonus" },
  })
}
