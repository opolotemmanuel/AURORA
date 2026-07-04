import type { AgeBand } from "@/generated/prisma/client"

export const CONSENT_VERSION = "1.0"

export const ONBOARDING_STEPS = [
  "welcome",
  "consent",
  "basics",
  "skin",
  "routine",
  "lifestyle",
  "location",
  "password",
  "complete",
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: "Welcome",
  consent: "Consent",
  basics: "About you",
  skin: "Skin profile",
  routine: "Routine",
  lifestyle: "Lifestyle",
  location: "Location",
  password: "Password",
  complete: "Finish",
}

/** Plain-language sun-sensitivity options (Fitzpatrick I–VI). Optional in onboarding. */
export const FITZPATRICK_OPTIONS = [
  {
    value: "I",
    label: "Very fair",
    hint: "Burns easily, rarely tans",
  },
  {
    value: "II",
    label: "Fair",
    hint: "Usually burns, tans a little",
  },
  {
    value: "III",
    label: "Medium",
    hint: "Sometimes burns, gradually tans",
  },
  {
    value: "IV",
    label: "Olive or light brown",
    hint: "Rarely burns, tans easily",
  },
  {
    value: "V",
    label: "Brown",
    hint: "Very rarely burns, tans deeply",
  },
  {
    value: "VI",
    label: "Deep brown or black",
    hint: "Almost never burns",
  },
] as const

/** Human-readable labels for snake_case skin profile values. */
export function formatSkinOptionLabel(value: string): string {
  const [first = "", ...rest] = value.split("_")
  const head = first ? `${first.charAt(0).toUpperCase()}${first.slice(1)}` : ""
  const tail = rest.map((word) => word.toLowerCase()).join(" ")
  return tail ? `${head} ${tail}` : head
}

export function deriveAgeBand(dateOfBirth: Date): AgeBand {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1
  }

  if (age < 18) return "under_18"
  if (age <= 24) return "age_18_24"
  if (age <= 34) return "age_25_34"
  if (age <= 44) return "age_35_44"
  if (age <= 54) return "age_45_54"
  if (age <= 64) return "age_55_64"
  return "age_65_plus"
}

export function getSignupTokenBonus(): number {
  const raw = process.env.SIGNUP_TOKEN_BONUS
  const parsed = raw ? Number.parseInt(raw, 10) : 10_000
  return Number.isFinite(parsed) ? parsed : 10_000
}
