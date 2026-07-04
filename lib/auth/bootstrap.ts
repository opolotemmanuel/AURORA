import { prisma } from "@/lib/db/client"
import { getSignupTokenBonus } from "@/lib/onboarding/constants"
import { grantTokens } from "@/lib/tokens/wallet"

export async function ensureUserRecords(userId: string, email: string, name?: string) {
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  await prisma.userLocation.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  await prisma.tokenWallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  })

  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase()
  if (bootstrapEmail && email.toLowerCase() === bootstrapEmail) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "admin" },
    })
  }

  if (name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name },
    })
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
