import type { Prisma } from "@/generated/prisma/client"
import type { ScanResult } from "@/generated/prisma/client"

import {
  DISCLAIMER_VERSION,
  SKIN_DISCLAIMER,
} from "@/lib/scan/constants"
import type {
  NaturalRecommendation,
  ProductRecommendation,
  SkinAssessment,
  SkinDimension,
} from "@/lib/scan/types"

export function toScanResultData(assessment: SkinAssessment) {
  return {
    overallBand: assessment.overallBand,
    dimensions: assessment.dimensions as unknown as Prisma.InputJsonValue,
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
    | "summary"
    | "naturalRecommendations"
    | "recommendations"
    | "disclaimerVersion"
  >,
): SkinAssessment {
  const dimensions = Array.isArray(result.dimensions)
    ? (result.dimensions as SkinDimension[])
    : []

  const naturalRecommendations = Array.isArray(result.naturalRecommendations)
    ? (result.naturalRecommendations as NaturalRecommendation[])
    : []

  const recommendations = Array.isArray(result.recommendations)
    ? (result.recommendations as ProductRecommendation[])
    : []

  return {
    overallBand: result.overallBand as SkinAssessment["overallBand"],
    dimensions,
    summary: result.summary ?? "",
    naturalRecommendations,
    recommendations,
    disclaimer: SKIN_DISCLAIMER,
  }
}
