import { z } from "zod"

import type { SkinAssessment } from "@/lib/scan/types"

const assessmentBandSchema = z.enum([
  "minimal",
  "mild",
  "moderate",
  "elevated",
  "not_assessed",
])

const applicationTimeSchema = z.enum([
  "morning",
  "evening",
  "anytime",
  "morning_and_evening",
])

const applicationFrequencySchema = z.enum([
  "once_daily",
  "twice_daily",
  "as_needed",
  "few_times_weekly",
  "weekly",
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
      applicationTime: applicationTimeSchema,
      applicationFrequency: applicationFrequencySchema,
    }),
  ),
  recommendations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      reason: z.string(),
      applicationTime: applicationTimeSchema,
      applicationFrequency: applicationFrequencySchema,
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
