"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { DEFAULT_POST_ONBOARDING_PATH } from "@/lib/auth/callback-url"
import {
  ONBOARDING_STEPS,
  type OnboardingStep,
} from "@/lib/onboarding/constants"

export function parseOnboardingStep(
  value: string | null | undefined,
): OnboardingStep | null {
  if (!value) return null
  return ONBOARDING_STEPS.includes(value as OnboardingStep)
    ? (value as OnboardingStep)
    : null
}

export function resolveOnboardingStep(
  urlStep: string | null | undefined,
  furthestStep: OnboardingStep,
): OnboardingStep {
  const parsed = parseOnboardingStep(urlStep)
  if (!parsed) return furthestStep

  const furthestIndex = ONBOARDING_STEPS.indexOf(furthestStep)
  const urlIndex = ONBOARDING_STEPS.indexOf(parsed)
  if (urlIndex < 0 || urlIndex > furthestIndex) return furthestStep

  return parsed
}

export function useOnboardingStepUrl(
  initialStep: OnboardingStep,
  callbackUrl?: string,
) {
  const searchParams = useSearchParams()
  const [furthestStep, setFurthestStep] = useState(initialStep)
  const [step, setStep] = useState<OnboardingStep>(() =>
    resolveOnboardingStep(searchParams.get("step"), initialStep),
  )

  const buildHref = useCallback(
    (next: OnboardingStep) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("step", next)
      if (callbackUrl && callbackUrl !== DEFAULT_POST_ONBOARDING_PATH) {
        params.set("callbackUrl", callbackUrl)
      } else {
        params.delete("callbackUrl")
      }
      const query = params.toString()
      return query ? `/onboarding?${query}` : "/onboarding"
    },
    [searchParams, callbackUrl],
  )

  const syncUrl = useCallback(
    (next: OnboardingStep, mode: "replace" | "push" = "replace") => {
      const href = buildHref(next)
      if (mode === "push") {
        window.history.pushState({ onboardingStep: next }, "", href)
      } else {
        window.history.replaceState({ onboardingStep: next }, "", href)
      }
    },
    [buildHref],
  )

  const goToStep = useCallback(
    (next: OnboardingStep) => {
      setStep(next)
      const nextIndex = ONBOARDING_STEPS.indexOf(next)
      const furthestIndex = ONBOARDING_STEPS.indexOf(furthestStep)
      if (nextIndex > furthestIndex) {
        setFurthestStep(next)
      }
      syncUrl(next, "replace")
    },
    [furthestStep, syncUrl],
  )

  useEffect(() => {
    const urlStep = searchParams.get("step")
    const resolved = resolveOnboardingStep(urlStep, furthestStep)
    setStep(resolved)
    if (urlStep !== resolved) {
      syncUrl(resolved, "replace")
    }
  }, [searchParams, furthestStep, syncUrl])

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search)
      const resolved = resolveOnboardingStep(params.get("step"), furthestStep)
      setStep(resolved)
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [furthestStep])

  return { step, goToStep }
}
