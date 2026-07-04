import { cache } from "react"

import { normalizeRole } from "@/lib/auth/role"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"

/** Single DB round-trip for dashboard layout auth chrome. */
export const getDashboardLayoutContext = cache(async (userId: string) => {
  return withDbRetry(async () => {
    const [profile, user] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: { onboardingCompletedAt: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
    ])

    return {
      completed: Boolean(profile?.onboardingCompletedAt),
      role: normalizeRole(user?.role),
    }
  })
})
