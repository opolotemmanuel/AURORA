import { redirect } from "next/navigation"

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { getOnboardingState } from "@/lib/onboarding/actions"
import type { OnboardingStep } from "@/lib/onboarding/constants"

export default async function OnboardingPage() {
  const { step, profile, user } = await getOnboardingState()

  if (profile.onboardingCompletedAt) {
    redirect("/dashboard")
  }

  return (
    <OnboardingWizard
      initialStep={step as OnboardingStep}
      userName={user.name ?? ""}
    />
  )
}
