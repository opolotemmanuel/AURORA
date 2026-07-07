import { GoogleGenAI, type ThinkingLevel } from "@google/genai"

import { skinAssessmentJsonSchema } from "@/lib/ai/schemas/assessment"
import { buildAnalyzeContents } from "@/lib/ai/prompts/system"
import type { AnalyzeSkinInput, AnalyzeSkinResult } from "@/lib/ai/types"
import { filterCatalogRecommendations } from "@/lib/products/validate-catalog-recommendations"
import { SKIN_DISCLAIMER } from "@/lib/scan/constants"
import { normalizeDimensions } from "@/lib/scan/normalize-dimensions"
import { skinAssessmentSchema } from "@/lib/scan/schemas"
import type { UsageInput } from "@/lib/tokens/pricing"

function mapUsage(
  provider: UsageInput["provider"],
  modelId: string,
  usageMetadata: {
    promptTokenCount?: number
    responseTokenCount?: number
    cachedContentTokenCount?: number
  } | undefined,
): UsageInput {
  return {
    provider,
    modelId,
    inputTokens: usageMetadata?.promptTokenCount ?? 0,
    outputTokens: usageMetadata?.responseTokenCount ?? 0,
    cachedTokens: usageMetadata?.cachedContentTokenCount ?? 0,
  }
}

function sanitizeAssessment(
  assessment: ReturnType<typeof skinAssessmentSchema.parse>,
  catalogSlugs: Set<string>,
) {
  const naturalRecommendations = assessment.naturalRecommendations.slice(0, 4)

  if (naturalRecommendations.length < 3) {
    throw new Error("Model returned insufficient natural recommendations")
  }

  const recommendations = filterCatalogRecommendations(
    assessment.recommendations,
    catalogSlugs,
  )

  return {
    ...assessment,
    dimensions: normalizeDimensions(assessment.dimensions),
    naturalRecommendations,
    recommendations,
  }
}

export async function analyzeWithGemini(
  input: AnalyzeSkinInput,
): Promise<AnalyzeSkinResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey })
  const { systemInstruction, contents } = buildAnalyzeContents(
    input,
    input.activeClimateTags ?? [],
  )
  const catalogSlugs = new Set(input.catalog.map((product) => product.slug))
  const startedAt = Date.now()

  const thinkingLevel = input.model.thinkingLevel
  const useThinking =
    thinkingLevel &&
    input.model.modelId.startsWith("gemini-3.")

  const response = await ai.models.generateContent({
    model: input.model.modelId,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: skinAssessmentJsonSchema,
      temperature: 0.4,
      ...(useThinking
        ? {
            thinkingConfig: {
              thinkingLevel: thinkingLevel as ThinkingLevel,
            },
          }
        : {}),
    },
  })

  const latencyMs = Date.now() - startedAt
  const text = response.text
  if (!text) {
    throw new Error("Empty response from Gemini")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Invalid JSON from Gemini")
  }

  const assessment = sanitizeAssessment(
    skinAssessmentSchema.parse({
      ...(parsed as object),
      disclaimer: SKIN_DISCLAIMER,
    }),
    catalogSlugs,
  )

  return {
    assessment,
    usage: mapUsage(
      input.model.provider,
      input.model.modelId,
      response.usageMetadata,
    ),
    latencyMs,
  }
}
