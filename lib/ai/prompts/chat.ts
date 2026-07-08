import type { CatalogProductContext, UserScanContext } from "@/lib/ai/types"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { SKIN_DIMENSIONS } from "@/lib/scan/dimensions"

const COSMETIC_RULES = `You are Aura, a cosmetic skin wellness assistant for Aurora Organics.

Your role is to provide cosmetic and wellness guidance only. You are NOT a medical professional and must NOT diagnose, treat, or name medical conditions.

Rules:
- Stay strictly within cosmetic skin wellness: routines, products, lifestyle habits, climate-aware care, dosha wellness lean, and explaining scan band results.
- Never invent numeric scores, percentages, or clinical certainty.
- If asked about medical symptoms, diagnoses, prescriptions, or non-skin topics, politely refuse and redirect to cosmetic guidance or a dermatologist.
- Recommend products ONLY from the provided Aurora catalog when suggesting products.
- Keep responses concise (2-4 short paragraphs max), supportive, and honest.
- Always remind users this is cosmetic guidance, not medical advice, when discussing specific skin patterns.`

export function buildAdviceSystemPrompt(): string {
  return `${COSMETIC_RULES}

The user has not completed a scan yet. Offer general cosmetic skin wellness guidance based on their profile and concerns. Encourage them to run a scan for personalized band-based assessment when relevant.`
}

export function buildFollowUpSystemPrompt(): string {
  return `${COSMETIC_RULES}

The user completed a skin scan. Use the scan assessment context below to answer follow-up questions about their results, routines, and product recommendations.`
}

export function buildAdviceContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  activeClimateTags: string[] = [],
): string {
  const profileBlock = userContext.profile
    ? JSON.stringify(userContext.profile, null, 2)
    : "No profile on file."
  const locationBlock = userContext.location
    ? JSON.stringify(userContext.location, null, 2)
    : "No location on file."
  const climateTagsBlock =
    activeClimateTags.length > 0
      ? activeClimateTags.join(", ")
      : "No active climate tags."
  const catalogBlock = JSON.stringify(catalog, null, 2)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Active climate tags:
${climateTagsBlock}

Aurora product catalog (JSON):
${catalogBlock}`
}

export function buildFollowUpContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  assessment: SkinAssessment,
  climateContext: ScanClimateContext | null,
  activeClimateTags: string[] = [],
): string {
  const dimensionList = SKIN_DIMENSIONS.map(
    (d) => `${d.id}: ${d.label}`,
  ).join(", ")

  const assessmentBlock = JSON.stringify(
    {
      overallBand: assessment.overallBand,
      summary: assessment.summary,
      dimensions: assessment.dimensions,
      doshaTyping: assessment.doshaTyping,
      naturalRecommendations: assessment.naturalRecommendations,
      recommendations: assessment.recommendations,
    },
    null,
    2,
  )

  const climateBlock = climateContext
    ? JSON.stringify(climateContext, null, 2)
    : "No climate context."

  return `${buildAdviceContextText(userContext, catalog, activeClimateTags)}

Scan assessment (JSON):
${assessmentBlock}

Scan climate context (JSON):
${climateBlock}

Dimension ids for reference: ${dimensionList}`
}

export const CHAT_REFUSAL_MESSAGE =
  "I can only help with cosmetic skin wellness — routines, products, and your scan results. For medical concerns, please see a dermatologist."
