"use client"

import { motion } from "motion/react"

import { OnboardingStepItem } from "@/components/onboarding/onboarding-step-panel"
import { Button } from "@/components/ui/button"
import { EASE_OUT } from "@/lib/ease"

type OnboardingStepActionsProps = {
  label: string
  pending: boolean
  canGoBack: boolean
  showBack?: boolean
  onBack: () => void
  onContinue: () => void
  skipLabel?: string
  onSkip?: () => void
}

export function OnboardingStepActions({
  label,
  pending,
  canGoBack,
  showBack = true,
  onBack,
  onContinue,
  skipLabel = "Skip for now",
  onSkip,
}: OnboardingStepActionsProps) {
  return (
    <OnboardingStepItem className="space-y-3 pt-2">
      <div className="flex flex-wrap gap-2">
        {showBack && canGoBack ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={pending}
          onClick={onContinue}
          className="min-w-28"
        >
          <motion.span
            key={pending ? "loading" : label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {pending ? "Saving…" : label}
          </motion.span>
        </Button>
      </div>
      {onSkip ? (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onSkip}
          className="text-muted-foreground h-auto px-0 py-0 text-sm hover:bg-transparent hover:text-foreground"
        >
          {skipLabel}
        </Button>
      ) : null}
    </OnboardingStepItem>
  )
}
