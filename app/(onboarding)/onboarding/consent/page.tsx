// Real implementation, replacing the earlier "Scan and data consent
// placeholder" stub. Reached two ways: straight after signup
// (components/auth/register-form.tsx redirects here instead of
// /dashboard), or an existing account's first /scan visit
// (app/(scan)/scan/page.tsx redirects here with ?next=/scan when
// scanConsentGivenAt is still null) — either way this is genuinely
// one-time: already-consented accounts are bounced straight to their
// destination without seeing the form again.
import { redirect } from "next/navigation"

import { OnboardingConsentForm } from "@/components/onboarding/consent-form"
import { getSession } from "@/lib/auth/session"
import { getSafeRedirectPath } from "@/lib/utils"
import { getScanConsentGivenAt } from "@/lib/user/scan-consent-store"

export const dynamic = "force-dynamic"

type OnboardingConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OnboardingConsentPage({ searchParams }: OnboardingConsentPageProps) {
  const session = await getSession()
  if (!session) {
    // (onboarding)/layout.tsx already redirects when there's no session,
    // but that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so
    // this page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const params = await searchParams
  const requestedNext = typeof params.next === "string" ? params.next : undefined
  const nextPath = getSafeRedirectPath(requestedNext) ?? "/dashboard"

  const alreadyConsented = await getScanConsentGivenAt(session.user.id)
  if (alreadyConsented) {
    redirect(nextPath)
  }

  return <OnboardingConsentForm nextPath={nextPath} />
}
