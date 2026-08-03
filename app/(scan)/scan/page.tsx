import { redirect } from "next/navigation"

import { ScanFlow } from "@/components/scan/ScanFlow"
import { getSession } from "@/lib/auth/session"
import { getRemainingScans } from "@/lib/scans/balance"
import { getScanConsentGivenAt } from "@/lib/user/scan-consent-store"

export const dynamic = "force-dynamic"

export default async function ScanStartPage() {
  const session = await getSession()
  if (!session) {
    // (scan)/layout.tsx already redirects when there's no session (this
    // route group has always been signed-in-only — see that file), but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so
    // this page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  // Consent is now given once — at signup, or here on an existing
  // account's first scan attempt — never re-asked after. See
  // app/(onboarding)/onboarding/consent/page.tsx.
  const consentGivenAt = await getScanConsentGivenAt(session.user.id)
  if (!consentGivenAt) {
    redirect("/onboarding/consent?next=/scan")
  }

  const scansRemaining = await getRemainingScans(session.user.id)

  return <ScanFlow scansRemaining={scansRemaining} />
}
