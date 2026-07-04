import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/server"
import { prisma } from "@/lib/db/client"

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requireRole(roles: string[]) {
  const session = await requireSession()
  const userRole = (session.user as { role?: string }).role ?? "user"
  if (!roles.includes(userRole)) {
    redirect("/dashboard")
  }
  return session
}

export async function requireAdmin() {
  return requireRole(["admin"])
}

export async function getOnboardingStatus(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true, onboardingStep: true },
  })

  return {
    completed: Boolean(profile?.onboardingCompletedAt),
    step: profile?.onboardingStep ?? "welcome",
  }
}

export async function requireOnboardingComplete() {
  const session = await requireSession()
  const { completed } = await getOnboardingStatus(session.user.id)
  if (!completed) {
    redirect("/onboarding")
  }
  return session
}
