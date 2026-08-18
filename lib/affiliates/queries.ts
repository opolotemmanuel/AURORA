import { cache } from "react"

import { prisma } from "@/lib/db/client"

export const getMyAffiliateProfile = cache(async (userId: string) => {
  return prisma.affiliateProfile.findUnique({ where: { userId } })
})

/** Ensures the singleton settings row exists and returns it. Not cached — it
 * writes on first call, so memoizing would risk returning a stale miss. */
export async function getAffiliateSettings() {
  return prisma.affiliateSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  })
}

export async function getAffiliateDashboardData(userId: string) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    include: {
      orders: { orderBy: { placedAt: "desc" } },
      payouts: { orderBy: { paidAt: "desc" } },
    },
  })
  if (!profile) return null

  const earnedCents = profile.orders
    .filter((order) => order.status === "confirmed")
    .reduce((sum, order) => sum + order.commissionAmountCents, 0)
  const paidCents = profile.payouts.reduce((sum, payout) => sum + payout.amountCents, 0)

  return {
    profile,
    earnedCents,
    paidCents,
    owedCents: earnedCents - paidCents,
  }
}
