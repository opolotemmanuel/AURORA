import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/server"
import { getUserRole } from "@/lib/auth/role"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"

export const getSession = cache(async () => {
  const requestHeaders = await headers()
  return withDbRetry(() =>
    auth.api.getSession({
      headers: requestHeaders,
    }),
  )
})

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requireRole(roles: string[]) {
  const session = await requireSession()
  const userRole = await getUserRole(session.user.id)
  if (!roles.includes(userRole)) {
    redirect("/dashboard")
  }
  return session
}

export async function requireAdmin() {
  return requireRole(["admin"])
}

export const getOnboardingStatus = cache(async (userId: string) => {
  const profile = await withDbRetry(() =>
    prisma.userProfile.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true, onboardingStep: true },
    }),
  )

  return {
    completed: Boolean(profile?.onboardingCompletedAt),
    step: profile?.onboardingStep ?? "welcome",
  }
})

export async function requireOnboardingComplete() {
  const session = await requireSession()
  const { completed } = await getOnboardingStatus(session.user.id)
  if (!completed) {
    redirect("/onboarding")
  }
  return session
}
