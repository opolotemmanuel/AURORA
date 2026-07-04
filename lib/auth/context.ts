import { cache } from "react"
import { redirect } from "next/navigation"

import { normalizeRole } from "@/lib/auth/role"
import { getSession } from "@/lib/auth/session"
import type { Session } from "@/lib/auth/server"
import type { AppRole } from "@/lib/dashboard/nav"

export type AuthContext = {
  session: Session
  user: Session["user"]
  userId: string
  role: AppRole
  onboardingCompleted: boolean
}

/** Single per-request auth loader — session, role, and onboarding gate from cached session. */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await getSession()
  if (!session) return null

  return {
    session,
    user: session.user,
    userId: session.user.id,
    role: normalizeRole(session.user.role),
    onboardingCompleted: Boolean(session.user.onboardingCompleted),
  }
})

/** Defensive redirect for pages/actions that need a guaranteed context. */
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }
  return ctx
}
