import type {
  CatalogProductContext,
  ScanHistoryContextItem,
  UserScanContext,
} from "@/lib/ai/types"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { SKIN_DIMENSIONS } from "@/lib/scan/dimensions"

const COSMETIC_RULES = `You are Aura, a cosmetic skin wellness assistant for Aurora Organics.

Your role is to provide cosmetic and wellness guidance only. You are NOT a medical professional and must NOT diagnose, treat, or name medical conditions.

Rules:
- Stay strictly within cosmetic skin wellness: routines, products, lifestyle habits, climate-aware care, dosha wellness lean, and explaining scan band results.
- Never invent numeric scores, percentages, or clinical certainty.
- If asked about medical symptoms, diagnoses, prescriptions, or non-skin topics, politely refuse and redirect to cosmetic guidance or a dermatologist.
- Recommend products ONLY from the provided Aurora catalog when suggesting products.
- When giving routines or advice, list natural, organic, and lifestyle solutions first. Mention Aurora catalog products only after, when relevant — never lead with products.
- Format routines and recommendations with markdown bullet lists or numbered lists. Avoid long unbroken paragraphs.
- For step-by-step routines, use one numbered list per section (e.g. Morning Routine). Put product or detail bullets on lines directly under each numbered step.
- When recommending a catalog product, format it as a markdown link: [Product Name](purchaseUrl) using the exact purchaseUrl from the catalog JSON.
- Keep responses concise and supportive.
- Always remind users this is cosmetic guidance, not medical advice, when discussing specific skin patterns.`

export function buildAdviceSystemPrompt(hasScanHistory: boolean): string {
  const scanGuidance = hasScanHistory
    ? "Use the user's profile, location, and scan history below for personalized cosmetic guidance. Reference past scan bands and trends when relevant."
    : "The user has no scan history yet. Offer general cosmetic skin wellness guidance based on their profile and concerns. Encourage them to run a scan for personalized band-based assessment when relevant."

  return `${COSMETIC_RULES}

${scanGuidance}`
}

export function buildFollowUpSystemPrompt(): string {
  return `${COSMETIC_RULES}

The user completed a skin scan. Use the current scan assessment context below to answer follow-up questions. Reference previous scans when comparing trends or answering history questions.`
}

export function buildScanHistoryContextText(
  history: ScanHistoryContextItem[],
  options: { label?: string } = {},
): string {
  const label = options.label ?? "Recent scan history"
  if (history.length === 0) {
    return `${label}: No completed scans on file.`
  }

  return `${label} (JSON):
${JSON.stringify(history, null, 2)}`
}

export function buildAdviceContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  scanHistory: ScanHistoryContextItem[],
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
  const historyBlock = buildScanHistoryContextText(scanHistory)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Active climate tags:
${climateTagsBlock}

${historyBlock}

Aurora product catalog (JSON):
${catalogBlock}`
}

export function buildFollowUpContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  assessment: SkinAssessment,
  climateContext: ScanClimateContext | null,
  scanHistory: ScanHistoryContextItem[],
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

  const historyBlock = buildScanHistoryContextText(scanHistory, {
    label: "Previous scans",
  })

  return `${buildAdviceContextText(userContext, catalog, [], activeClimateTags)}

Current scan assessment (JSON):
${assessmentBlock}

Scan climate context (JSON):
${climateBlock}

${historyBlock}

Dimension ids for reference: ${dimensionList}`
}

export const CHAT_REFUSAL_MESSAGE =
  "I can only help with cosmetic skin wellness — routines, products, and your scan results. For medical concerns, please see a dermatologist."
