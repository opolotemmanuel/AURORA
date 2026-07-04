import { redirect } from "next/navigation"
import { Suspense } from "react"

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import {
  DEFAULT_POST_ONBOARDING_PATH,
  safeCallbackPath,
} from "@/lib/auth/callback-url"
import { getOnboardingContext } from "@/lib/onboarding/context"

export default async function OnboardingPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ callbackUrl?: string }>
}>) {
  const { callbackUrl: rawCallbackUrl } = await searchParams
  const context = await getOnboardingContext()

  if (!context) {
    redirect("/login")
  }

  if (context.completed) {
    const destination = safeCallbackPath(
      rawCallbackUrl,
      DEFAULT_POST_ONBOARDING_PATH,
    )
    redirect(
      destination === "/onboarding"
        ? DEFAULT_POST_ONBOARDING_PATH
        : destination,
    )
  }

  const callbackUrl = safeCallbackPath(
    rawCallbackUrl,
    DEFAULT_POST_ONBOARDING_PATH,
  )

  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground py-12 text-center text-sm">
          Loading onboarding…
        </div>
      }
    >
      <OnboardingWizard
        initialStep={context.step}
        userName={context.user.name ?? ""}
        callbackUrl={callbackUrl}
      />
    </Suspense>
  )
}
