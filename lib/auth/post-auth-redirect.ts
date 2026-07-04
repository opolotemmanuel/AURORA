"use server"

import { prisma } from "@/lib/db/client"

export async function getPostAuthRedirect(userId: string): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true },
  })

  return profile?.onboardingCompletedAt ? "/dashboard" : "/onboarding"
}
