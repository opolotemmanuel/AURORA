"use client"

import {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from "@/lib/onboarding/constants"
import { cn } from "@/lib/utils"

type OnboardingStepperProps = {
  currentStep: OnboardingStep
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep)

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          Step {currentIndex + 1} of {ONBOARDING_STEPS.length}
        </p>
        <p className="text-sm text-muted-foreground">
          {ONBOARDING_STEP_LABELS[currentStep]}
        </p>
      </div>

      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS.length}
        aria-valuenow={currentIndex + 1}
      >
        {ONBOARDING_STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div
              key={step}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                isComplete || isCurrent ? "bg-primary" : "bg-muted",
              )}
              aria-hidden
            />
          )
        })}
      </div>
    </div>
  )
}
