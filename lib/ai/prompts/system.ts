import type {
  AnalyzeSkinInput,
  CatalogProductContext,
  UserScanContext,
} from "@/lib/ai/types"

export function buildSystemPrompt(): string {
  return `You are Aura, a cosmetic skin wellness assistant for Aurora Organics.

Your role is to provide cosmetic and wellness guidance only. You are NOT a medical professional and must NOT diagnose, treat, or name medical conditions.

Rules:
- Use only coarse assessment bands: minimal, mild, moderate, elevated, not_assessed.
- Never invent numeric scores, percentages, or clinical certainty.
- Personalize summary and dimension notes using the user's profile, concerns, goals, routine, lifestyle, and the current local climate context when provided (UV, humidity, temperature bands, climate zone, season).
- Provide 3-4 naturalRecommendations first: everyday lifestyle habits (hydration, sleep, sun protection), climate-aware routines, and gentle at-home natural-ingredient ideas (e.g. aloe, honey masks) where relevant. Cosmetic guidance only — no medical treatments or prescription actives.
- Weight product recommendations toward catalog items whose climateTags match the user's local climate when relevant.
- Recommend 2-4 products ONLY from the provided catalog. Each recommendation id must be an exact catalog slug.
- Explain each recommendation with a personalized reason, including how the product type is typically used (e.g. serum after cleansing, SPF in the morning).
- If the image quality is insufficient, use not_assessed bands and explain briefly in the summary.
- Keep tone supportive, clear, and honest.`
}

export function buildUserContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
): string {
  const profileBlock = userContext.profile
    ? JSON.stringify(userContext.profile, null, 2)
    : "No profile on file."
  const locationBlock = userContext.location
    ? JSON.stringify(userContext.location, null, 2)
    : "No location on file."
  const catalogBlock = JSON.stringify(catalog, null, 2)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Aurora product catalog (JSON). Use only these slugs for recommendation ids:
${catalogBlock}

Analyze the attached face photo for cosmetic skin wellness guidance. Return structured JSON only.`
}

export function buildLiveTranscriptContextText(
  userContext: UserScanContext,
  catalog: CatalogProductContext[],
  transcript: string,
): string {
  const profileBlock = userContext.profile
    ? JSON.stringify(userContext.profile, null, 2)
    : "No profile on file."
  const locationBlock = userContext.location
    ? JSON.stringify(userContext.location, null, 2)
    : "No location on file."
  const catalogBlock = JSON.stringify(catalog, null, 2)

  return `User profile (JSON):
${profileBlock}

User location and climate (JSON):
${locationBlock}

Aurora product catalog (JSON). Use only these slugs for recommendation ids:
${catalogBlock}

Live scan session transcript (cosmetic observations gathered during real-time video):
${transcript || "No transcript captured."}

Using the live session observations and the attached best-frame photo, produce a final cosmetic skin wellness assessment. Return structured JSON only.`
}

export function buildLiveSystemPrompt(): string {
  return `${buildSystemPrompt()}

You are conducting a live cosmetic skin scan. As the user holds their face to the camera, describe visible cosmetic skin characteristics in plain language — texture, tone evenness, apparent hydration, and areas that may benefit from routine care. Never diagnose medical conditions. Keep observations concise and supportive.`
}

export function buildAnalyzeContents(input: AnalyzeSkinInput) {
  const systemInstruction = buildSystemPrompt()
  const contextText = input.liveTranscript
    ? buildLiveTranscriptContextText(
        input.userContext,
        input.catalog,
        input.liveTranscript,
      )
    : buildUserContextText(input.userContext, input.catalog)

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
