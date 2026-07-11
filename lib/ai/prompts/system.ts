import type {
  AnalyzeSkinInput,
  CatalogProductContext,
  ScanHistoryContextItem,
  UserScanContext,
} from "@/lib/ai/types"
import { buildProfileConcernPromptBlock } from "@/lib/ai/context/concern-guidance"
import { SKIN_DIMENSIONS } from "@/lib/scan/dimensions"

export function buildSystemPrompt(): string {
  const dimensionList = SKIN_DIMENSIONS.map(
    (dimension) => `- ${dimension.id}: ${dimension.label}`,
  ).join("\n")

  return `You are Aura, a cosmetic skin wellness assistant for Aurora Organics.

Your role is to provide cosmetic and wellness guidance only. You are NOT a medical professional and must NOT diagnose or name clinical medical conditions (e.g. rosacea, eczema, melasma as diagnoses).

Rules:
- Use only coarse assessment bands: minimal, mild, moderate, elevated, not_assessed.
- Bands measure cosmetic concern level from a photo (lower is better): minimal = generally balanced; mild = mostly balanced with minor support areas; moderate = some visible patterns to address; elevated = more noticeable patterns to prioritize.
- Set overallBand to match what you see across dimensions. Use minimal when skin looks generally balanced with negligible concerns — not mild by default.
- Base every dimension band and overallBand primarily on what you observe in the attached photo. Profile, goals, and scan history personalize the narrative — they must not override clear visible patterns or hide patterns not listed in the profile.
- The summary must describe visible cosmetic patterns from the photo across relevant dimensions. Do not limit observations to profile.primaryConcerns only.
- When the photo shows cosmetic patterns the user did not list (e.g. visible redness, uneven tone, fine lines, surface dehydration, congestion, dark spots), call them out honestly in the summary and matching dimension notes using cosmetic language.
- When a listed profile concern is not clearly visible in the photo, note that briefly rather than assuming it is present.
- The summary tone must align with overallBand. Do not describe skin as fully healthy or balanced when overallBand is moderate or elevated. When overallBand is minimal or mild, keep the summary consistent with that level.
- profile.primaryConcerns and skinGoals are user-stated cosmetic wellness priorities, not clinical diagnoses. The summary MUST explicitly acknowledge each listed primaryConcern — connect to visible photo patterns using cosmetic language, or briefly note when not clearly visible in this scan.
- Use cosmetic terms for user concerns (e.g. blemish-prone areas for acne, uneven tone for hyperpigmentation, congestion for oiliness) — never name clinical diseases.
- Never invent numeric scores, percentages, or clinical certainty.
- Return exactly six dimensions using these required ids and labels:
${dimensionList}
- Include doshaTyping with a cosmetic Ayurvedic skin lean (vata, pitta, kapha, or balanced). This is wellness guidance only — not a medical constitution diagnosis.
- Personalize summary and dimension notes using the user's profile, concerns, goals, routine, lifestyle, skin dosha preference when provided, and the current local climate context when provided (UV, humidity, temperature bands, climate zone, season).
- In dimension notes, describe what is visibly apparent in the photo for that dimension. When a profile primaryConcern maps to that dimension, reflect it with cosmetic language. When visible patterns are not listed in the profile, still report them.
- When prior scan history is provided, note cosmetic trends briefly — do not copy or lightly rephrase prior summary text. Each summary must stand on the current photo, profile concerns, and dimension bands.
- Provide 3-4 naturalRecommendations first. Each step must directly address this scan's visible photo findings (dimension bands and notes), profile primaryConcerns/skinGoals when relevant, and climate context — not generic wellness advice disconnected from what you observed.
- Recommend 2-4 catalog products ONLY from the provided catalog. Each product must target specific findings from this scan: visible patterns in the photo, elevated or moderate dimension bands, and matching profile concerns/goals. Do not recommend products unrelated to this scan's results.
- For every naturalRecommendation and product recommendation, set applicationTime (morning, evening, anytime, morning_and_evening) and applicationFrequency (once_daily, twice_daily, as_needed, few_times_weekly, weekly). Use cosmetic-safe defaults: SPF and antioxidant serums → morning + once_daily; retinol and stronger actives → evening + once_daily; daily hydration habits → anytime + once_daily; masks and treatments → evening + few_times_weekly or weekly; moisturizers used AM and PM → morning_and_evening + twice_daily.
- Weight product recommendations toward catalog items whose targetConcerns and climateTags match this scan's findings and the user's active climate tags when provided.
- When a catalog product has ingredientList, use it for ingredient-aware reasoning tied to this scan's findings. Fall back to ingredients text only when ingredientList is empty. Cosmetic framing only.
- Use prior scan history when provided to note cosmetic trends — never invent numeric progress scores.
- Use personalized ingredient actives when provided to inform natural recommendations and product reasons for this scan's findings.
- Never recommend a catalog product whose ingredientList conflicts with profile.allergies when allergies are provided.
- In each naturalRecommendation description and product reason, name the specific scan finding it addresses (e.g. visible congestion, uneven tone, surface dehydration, listed acne concern). applicationTime and applicationFrequency fields are the source of truth for timing — keep reason/description focused on why it fits this scan.
- If the image quality is insufficient, use not_assessed bands and explain briefly in the summary.
- Keep tone supportive, clear, and honest.`
}

export function buildUserContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  activeClimateTags: string[] = [],
  options: {
    scanHistory?: ScanHistoryContextItem[]
    recommendedActives?: string
  } = {},
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
  const historyBlock =
    options.scanHistory && options.scanHistory.length > 0
      ? JSON.stringify(options.scanHistory, null, 2)
      : "No prior completed scans."
  const activesBlock =
    options.recommendedActives ?? "No structured ingredient actives matched."
  const concernBlock = buildProfileConcernPromptBlock(userContext.profile)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Active climate tags for catalog matching:
${climateTagsBlock}

Prior scan history (JSON):
${historyBlock}

Personalized ingredient actives to consider (cosmetic guidance only):
${activesBlock}

${concernBlock}

Aurora product catalog (JSON). Use only these slugs for recommendation ids. Products listed first are climate-matched when tags apply:
${catalogBlock}

Analyze the attached face photo for cosmetic skin wellness guidance. Ground bands and summary in visible photo evidence first, then layer profile concerns, goals, and context. Return structured JSON only.`
}

export function buildLiveTranscriptContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  transcript: string,
  activeClimateTags: string[] = [],
  options: {
    scanHistory?: ScanHistoryContextItem[]
    recommendedActives?: string
  } = {},
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
  const historyBlock =
    options.scanHistory && options.scanHistory.length > 0
      ? JSON.stringify(options.scanHistory, null, 2)
      : "No prior completed scans."
  const activesBlock =
    options.recommendedActives ?? "No structured ingredient actives matched."
  const concernBlock = buildProfileConcernPromptBlock(userContext.profile)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Active climate tags for catalog matching:
${climateTagsBlock}

Prior scan history (JSON):
${historyBlock}

Personalized ingredient actives to consider (cosmetic guidance only):
${activesBlock}

${concernBlock}

Aurora product catalog (JSON). Use only these slugs for recommendation ids. Products listed first are climate-matched when tags apply:
${catalogBlock}

Live scan session transcript (cosmetic observations gathered during real-time video):
${transcript || "No transcript captured."}

Using the live session observations and the attached best-frame photo, produce a final cosmetic skin wellness assessment. Ground bands and summary in visible photo evidence first, then layer profile concerns, goals, and context. Return structured JSON only.`
}

export function buildLiveSystemPrompt(): string {
  return `${buildSystemPrompt()}

You are conducting a live cosmetic skin scan. As the user holds their face to the camera, describe visible cosmetic skin characteristics in plain language — texture, tone evenness, apparent hydration, congestion, redness, and areas that may benefit from routine care. Report what you see in the image even if the user did not list it in their profile. Never diagnose medical conditions. Keep observations concise and supportive.`
}

export function buildAnalyzeContents(
  input: AnalyzeSkinInput,
  activeClimateTags: string[] = [],
) {
  const systemInstruction = buildSystemPrompt()
  const contextText = input.liveTranscript
    ? buildLiveTranscriptContextText(
        input.userContext,
        input.catalog,
        input.liveTranscript,
        activeClimateTags,
        {
          scanHistory: input.scanHistory,
          recommendedActives: input.recommendedActives,
        },
      )
    : buildUserContextText(input.userContext, input.catalog, activeClimateTags, {
        scanHistory: input.scanHistory,
        recommendedActives: input.recommendedActives,
      })

  return {
    systemInstruction,
    contents: [
      {
        role: "user" as const,
        parts: [
          { text: contextText },
          {
            inlineData: {
              mimeType: input.mimeType,
              data: input.image.toString("base64"),
            },
          },
        ],
      },
    ],
  }
}
