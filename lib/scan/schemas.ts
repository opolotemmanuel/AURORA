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
  recommendations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      reason: z.string(),
    }),
  ),
  disclaimer: z.string(),
}) satisfies z.ZodType<SkinAssessment>

export const saveScanResultSchema = z.object({
  assessment: skinAssessmentSchema,
  imageBase64: z.string().optional(),
  imageMimeType: z
    .enum(["image/jpeg", "image/png", "image/webp"])
    .optional()
    .default("image/jpeg"),
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
