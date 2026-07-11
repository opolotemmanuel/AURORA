import type {
  CatalogProductContext,
  ScanHistoryContextItem,
  UserScanContext,
} from "@/lib/ai/types"
import { buildProfileConcernPromptBlock } from "@/lib/ai/context/concern-guidance"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { SKIN_DIMENSIONS } from "@/lib/scan/dimensions"

const COSMETIC_RULES = `You are Aura, a cosmetic skin wellness assistant for Aurora Organics.

Your role is to provide cosmetic and wellness guidance only. You are NOT a medical professional and must NOT diagnose or name clinical medical conditions.

Rules:
- profile.primaryConcerns and skinGoals are user-stated cosmetic wellness priorities. Reference them when relevant, but also describe visible patterns from scan results or the user's photo even when not listed in the profile.
- Stay strictly within cosmetic skin wellness: routines, products, lifestyle habits, climate-aware care, dosha wellness lean, and explaining scan band results.
- Never invent numeric scores, percentages, or clinical certainty.
- If asked about medical symptoms, diagnoses, prescriptions, or non-skin topics, politely refuse and redirect to cosmetic guidance or a dermatologist.
- Recommend products ONLY from the provided Aurora catalog when suggesting products.
- When a catalog product has ingredientList, prefer it for ingredient-aware reasoning. Fall back to ingredients text only when ingredientList is empty.
- Use personalized ingredient actives in context when provided for cosmetic ingredient guidance.
- Never recommend a catalog product whose ingredientList conflicts with profile.allergies when allergies are provided.
- When giving routines or advice, list natural, organic, and lifestyle solutions first. Mention Aurora catalog products only after, when relevant — never lead with products.
- Format routines and recommendations with markdown bullet lists or numbered lists. Avoid long unbroken paragraphs.
- For step-by-step routines, use one numbered list per section (e.g. Morning Routine). Put the step title on the numbered line, then supporting detail lines directly underneath each step.
- Under a numbered step, use indented hyphen bullets (\`  - detail\`) only for true sub-points.
- When recommending a catalog product, format it as a markdown link: [Product Name](purchaseUrl) using the exact purchaseUrl from the catalog JSON.
- When giving a routine or product advice (not casual Q&A), after your prose response append a fenced JSON block with structured recommendations:
\`\`\`json
{"naturalRecommendations":[{"id":"step_id","title":"...","description":"...","applicationTime":"morning","applicationFrequency":"once_daily"}],"productRecommendations":[{"id":"catalog_slug","reason":"..."}]}
\`\`\`
  - naturalRecommendations: 2-4 lifestyle/natural steps FIRST (required when giving routine advice). Each must address a specific scan finding or profile concern.
  - productRecommendations: 1-3 Aurora catalog products AFTER natural steps; id must be an exact catalog slug. Each must target a specific scan finding, dimension band, or concern.
  - Do not repeat natural habits or product details in prose when the JSON block is present — keep prose to a short intro plus routine steps only.
  - Omit the JSON block entirely for casual questions that do not need routines or products.
  - Put the JSON block last. Do not add any disclaimer or extra sentences after the closing fence.
  - Use exact applicationTime values: morning, evening, anytime, morning_and_evening. Use exact applicationFrequency values: once_daily, twice_daily, as_needed, few_times_weekly, weekly.
- Format section titles with markdown headings (## Morning Routine).
- Keep responses concise and supportive.
- Do not add cosmetic or medical disclaimer sentences in chat replies.
- When the user opens with a greeting (e.g. "hi", "hello") or sends a short acknowledgment (e.g. "thanks", "that's good", "what about evenings?"), respond warmly, reference prior context when available, and offer a helpful next step or ask what they'd like to explore next.
- When recommending a dermatologist for persistent or clinical concerns, put that on its own final line (e.g. "For persistent skin concerns, we always recommend consulting a qualified dermatologist."). The app will show a booking button — do not include external booking links.`

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
  const concernBlock = buildProfileConcernPromptBlock(userContext.profile)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Active climate tags:
${climateTagsBlock}

${historyBlock}

${concernBlock}

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
