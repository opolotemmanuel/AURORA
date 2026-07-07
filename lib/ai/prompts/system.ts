import type {
  AnalyzeSkinInput,
  CatalogProductContext,
  UserScanContext,
} from "@/lib/ai/types"
import { SKIN_DIMENSIONS } from "@/lib/scan/dimensions"

export function buildSystemPrompt(): string {
  const dimensionList = SKIN_DIMENSIONS.map(
    (dimension) => `- ${dimension.id}: ${dimension.label}`,
  ).join("\n")

  return `You are Aura, a cosmetic skin wellness assistant for Aurora Organics.

Your role is to provide cosmetic and wellness guidance only. You are NOT a medical professional and must NOT diagnose, treat, or name medical conditions.

Rules:
- Use only coarse assessment bands: minimal, mild, moderate, elevated, not_assessed.
- Bands measure cosmetic concern level from a photo (lower is better): minimal = generally balanced; mild = mostly balanced with minor support areas; moderate = some visible patterns to address; elevated = more noticeable patterns to prioritize.
- Set overallBand to match what you see across dimensions. Use minimal when skin looks generally balanced with negligible concerns — not mild by default.
- The summary tone must align with overallBand. Do not describe skin as fully healthy or balanced when overallBand is moderate or elevated. When overallBand is minimal or mild, keep the summary consistent with that level.
- Never invent numeric scores, percentages, or clinical certainty.
- Return exactly six dimensions using these required ids and labels:
${dimensionList}
- Include doshaTyping with a cosmetic Ayurvedic skin lean (vata, pitta, kapha, or balanced). This is wellness guidance only — not a medical constitution diagnosis.
- Personalize summary and dimension notes using the user's profile, concerns, goals, routine, lifestyle, skin dosha preference when provided, and the current local climate context when provided (UV, humidity, temperature bands, climate zone, season).
- Provide 3-4 naturalRecommendations first: everyday lifestyle habits (hydration, sleep, sun protection), climate-aware routines, and gentle at-home natural-ingredient ideas (e.g. aloe, honey masks) where relevant. Cosmetic guidance only — no medical treatments or prescription actives.
- For every naturalRecommendation and product recommendation, set applicationTime (morning, evening, anytime, morning_and_evening) and applicationFrequency (once_daily, twice_daily, as_needed, few_times_weekly, weekly). Use cosmetic-safe defaults: SPF and antioxidant serums → morning + once_daily; retinol and stronger actives → evening + once_daily; daily hydration habits → anytime + once_daily; masks and treatments → evening + few_times_weekly or weekly; moisturizers used AM and PM → morning_and_evening + twice_daily.
- Weight product recommendations toward catalog items whose climateTags match the user's active climate tags when provided.
- Recommend 2-4 products ONLY from the provided catalog. Each recommendation id must be an exact catalog slug.
- Explain each recommendation with a personalized reason, including how the product type is typically used (e.g. serum after cleansing). applicationTime and applicationFrequency fields are the source of truth for timing — keep reason/description focused on why it fits this user.
- If the image quality is insufficient, use not_assessed bands and explain briefly in the summary.
- Keep tone supportive, clear, and honest.`
}

export function buildUserContextText(
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

Active climate tags for catalog matching:
${climateTagsBlock}

Aurora product catalog (JSON). Use only these slugs for recommendation ids. Products listed first are climate-matched when tags apply:
${catalogBlock}

Analyze the attached face photo for cosmetic skin wellness guidance. Return structured JSON only.`
}

export function buildLiveTranscriptContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  transcript: string,
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

Active climate tags for catalog matching:
${climateTagsBlock}

Aurora product catalog (JSON). Use only these slugs for recommendation ids. Products listed first are climate-matched when tags apply:
${catalogBlock}

Live scan session transcript (cosmetic observations gathered during real-time video):
${transcript || "No transcript captured."}

Using the live session observations and the attached best-frame photo, produce a final cosmetic skin wellness assessment. Return structured JSON only.`
}

export function buildLiveSystemPrompt(): string {
  return `${buildSystemPrompt()}

You are conducting a live cosmetic skin scan. As the user holds their face to the camera, describe visible cosmetic skin characteristics in plain language — texture, tone evenness, apparent hydration, and areas that may benefit from routine care. Never diagnose medical conditions. Keep observations concise and supportive.`
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
      )
    : buildUserContextText(
        input.userContext,
        input.catalog,
        activeClimateTags,
      )

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
