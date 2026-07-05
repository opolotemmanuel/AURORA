import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getAuthContext } from "@/lib/auth/context"
import { auth } from "@/lib/auth/server"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"

export const getSession = cache(async () => {
  const requestHeaders = await headers()
  return withDbRetry(
    () =>
      auth.api.getSession({
        headers: requestHeaders,
      }),
    3,
  )
})

export async function requireSession() {
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }
  return ctx.session
}

export async function requireRole(roles: string[]) {
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }
  if (!roles.includes(ctx.role)) {
    redirect("/dashboard")
  }
  return ctx.session
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
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }
  if (!ctx.onboardingCompleted) {
    redirect("/onboarding")
  }
  return ctx.session
}
