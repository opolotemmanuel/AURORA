import type { Prisma } from "@/generated/prisma/client"
import type { ScanResult } from "@/generated/prisma/client"

import {
  DISCLAIMER_VERSION,
  SKIN_DISCLAIMER,
} from "@/lib/scan/constants"
import type { DoshaTyping } from "@/lib/scan/types"
import { normalizeDimensions } from "@/lib/scan/normalize-dimensions"
import type {
  NaturalRecommendation,
  ProductRecommendation,
  SkinAssessment,
  SkinDimension,
} from "@/lib/scan/types"

const DEFAULT_DOSHA_TYPING: DoshaTyping = {
  primary: "balanced",
  secondary: null,
  note: "Dosha lean was not assessed for this scan.",
}

export function toScanResultData(assessment: SkinAssessment) {
  return {
    overallBand: assessment.overallBand,
    dimensions: assessment.dimensions as unknown as Prisma.InputJsonValue,
    doshaTyping: assessment.doshaTyping as unknown as Prisma.InputJsonValue,
    summary: assessment.summary,
    naturalRecommendations:
      assessment.naturalRecommendations as unknown as Prisma.InputJsonValue,
    recommendations:
      assessment.recommendations as unknown as Prisma.InputJsonValue,
    disclaimerVersion: DISCLAIMER_VERSION,
  }
}

export function fromScanResult(
  result: Pick<
    ScanResult,
    | "overallBand"
    | "dimensions"
    | "doshaTyping"
    | "summary"
    | "naturalRecommendations"
    | "recommendations"
    | "disclaimerVersion"
  >,
): SkinAssessment {
  const dimensions = Array.isArray(result.dimensions)
    ? normalizeDimensions(result.dimensions as SkinDimension[])
    : normalizeDimensions([])

  const doshaTyping =
    result.doshaTyping && typeof result.doshaTyping === "object"
      ? (result.doshaTyping as DoshaTyping)
      : DEFAULT_DOSHA_TYPING

  const naturalRecommendations = Array.isArray(result.naturalRecommendations)
    ? (result.naturalRecommendations as NaturalRecommendation[])
    : []

  const recommendations = Array.isArray(result.recommendations)
    ? (result.recommendations as ProductRecommendation[])
    : []

  return {
    overallBand: result.overallBand as SkinAssessment["overallBand"],
    dimensions,
    doshaTyping,
    summary: result.summary ?? "",
    naturalRecommendations,
    recommendations,
    disclaimer: SKIN_DISCLAIMER,
  }
}
