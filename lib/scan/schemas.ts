import { z } from "zod"

import type { SkinAssessment } from "@/lib/scan/types"

const assessmentBandSchema = z.enum([
  "minimal",
  "mild",
  "moderate",
  "elevated",
  "not_assessed",
])

export const skinAssessmentSchema = z.object({
  overallBand: assessmentBandSchema,
  dimensions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      band: assessmentBandSchema,
      note: z.string(),
    }),
  ),
  summary: z.string(),
  naturalRecommendations: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
    }),
  ),
  recommendations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      reason: z.string(),
      imageUrl: z.string().url().nullable().optional(),
      storeUrl: z.string().url().nullable().optional(),
    }),
  ),
  disclaimer: z.string(),
}) satisfies z.ZodType<SkinAssessment>

export const saveScanResultSchema = z.object({
  assessment: skinAssessmentSchema,
  usage: z
    .object({
      provider: z.enum(["gemini", "vercel_ai", "openrouter", "other"]),
      modelId: z.string(),
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      cachedTokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
})
