import type { SkinDimensionId } from "@/lib/scan/dimensions"
import type { UserScanContext } from "@/lib/ai/types"

type ConcernMapping = {
  dimensions: SkinDimensionId[]
  cosmeticTerms: string
}

/** Maps onboarding/profile concern ids to scan dimensions and allowed cosmetic language. */
export const PROFILE_CONCERN_GUIDANCE: Record<string, ConcernMapping> = {
  acne: {
    dimensions: ["texture_pores", "redness"],
    cosmeticTerms: "blemishes, breakout-prone areas, congestion",
  },
  oiliness: {
    dimensions: ["texture_pores", "hydration"],
    cosmeticTerms: "excess sebum, shine, oil balance",
  },
  dryness: {
    dimensions: ["hydration", "texture_pores"],
    cosmeticTerms: "dry patches, surface dehydration",
  },
  redness: {
    dimensions: ["redness"],
    cosmeticTerms: "visible redness, flushing",
  },
  hyperpigmentation: {
    dimensions: ["pigmentation", "aging_spots"],
    cosmeticTerms: "uneven tone, dark spots, post-blemish marks",
  },
  aging: {
    dimensions: ["wrinkles", "aging_spots"],
    cosmeticTerms: "fine lines, elasticity, visible aging patterns",
  },
  sensitivity: {
    dimensions: ["redness"],
    cosmeticTerms: "reactive appearance, irritation-prone areas",
  },
  texture: {
    dimensions: ["texture_pores"],
    cosmeticTerms: "uneven texture, enlarged pores, roughness",
  },
}

const SKIN_GOAL_GUIDANCE: Record<string, string> = {
  hydration: "surface hydration and moisture balance",
  even_tone: "tone evenness and pigmentation",
  clear_skin: "blemish and congestion patterns",
  barrier_support: "barrier comfort and sensitivity",
  sun_protection: "UV exposure and pigmentation protection",
  gentle_routine: "gentle, low-irritation care",
}

function formatConcernLine(concern: string): string | null {
  const mapping = PROFILE_CONCERN_GUIDANCE[concern]
  if (!mapping) return null
  return `- ${concern}: reflect in ${mapping.dimensions.join(", ")} using cosmetic terms such as ${mapping.cosmeticTerms}`
}

function formatGoalLine(goal: string): string | null {
  const guidance = SKIN_GOAL_GUIDANCE[goal]
  if (!guidance) return null
  return `- ${goal}: tie recommendations to ${guidance}`
}

export function collectProfileWellnessPriorities(
  profile: UserScanContext["profile"],
): string[] {
  if (!profile) return []
  const priorities = new Set<string>()
  for (const concern of profile.primaryConcerns) {
    priorities.add(concern)
  }
  for (const goal of profile.skinGoals) {
    priorities.add(goal)
  }
  return [...priorities]
}

export function buildProfileConcernPromptBlock(
  profile: UserScanContext["profile"],
): string {
  const sections: string[] = [
    "Photo-first analysis:",
    "- Assess all six dimensions from the attached image before personalizing.",
    "- Report visible cosmetic patterns even when they are not in the user's profile.",
    "- Profile concerns and goals personalize the narrative; they do not limit what you observe.",
    "Recommendation rules:",
    "- naturalRecommendations and catalog products must each target specific findings from this scan: visible photo patterns, dimension bands (especially moderate/elevated), and relevant profile concerns/goals.",
    "- Do not suggest generic habits or products disconnected from what you observed in the image.",
  ]

  if (!profile) {
    return sections.join("\n")
  }

  const concernLines = profile.primaryConcerns
    .map(formatConcernLine)
    .filter((line): line is string => line != null)
  const goalLines = profile.skinGoals
    .map(formatGoalLine)
    .filter((line): line is string => line != null)

  if (concernLines.length === 0 && goalLines.length === 0) {
    return sections.join("\n")
  }

  sections.push(
    "Profile wellness priorities — also address in summary, dimension notes, and recommendations using cosmetic language only:",
  )

  if (concernLines.length > 0) {
    sections.push("Primary concerns:", ...concernLines)
  }

  if (goalLines.length > 0) {
    sections.push("Skin goals:", ...goalLines)
  }

  if (profile.primaryConcerns.length > 0) {
    sections.push(
      `Also acknowledge each listed primary concern (${profile.primaryConcerns.join(", ")}): connect to visible photo patterns where supported, or briefly note when not clearly visible in this scan.`,
    )
  }

  return sections.join("\n")
}
