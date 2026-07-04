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
