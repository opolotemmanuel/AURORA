import {
  createId,
  saveAiProviderEvent,
  saveAuditLog,
  saveReportBundle,
} from "@/lib/backend/report-store"
import { listActiveRecommendationProducts } from "@/lib/backend/product-service"
import type {
  ScanAnalysisReport,
  ScanImageMetadata,
  ScanSource,
  ScanStatus,
  StoredReportBundle,
} from "@/lib/backend/types"
import {
  RECOMMENDATION_DISCLAIMER,
  recommendAuroraProducts,
} from "@/lib/recommendations/recommendation-engine"
import type { CosmeticAnalysisInput, SkinConcern } from "@/lib/recommendations/types"

const FINDING_CONCERN_MAP: Record<string, SkinConcern> = {
  "visible texture": "texture",
  texture: "texture",
  "hydration signs": "hydration",
  hydration: "hydration",
  "redness appearance": "rednessAppearance",
  redness: "rednessAppearance",
  pigmentation: "pigmentationAppearance",
  "tone unevenness": "pigmentationAppearance",
  radiance: "radiance",
}

export async function createScanReport(input: {
  image: ScanImageMetadata
  analysis: ScanAnalysisReport
  source?: ScanSource
  fallbackReason?: string
  aiProviderReason?: string
  userId?: string
}): Promise<StoredReportBundle> {
  const now = new Date().toISOString()
  const scanId = createId("scan")
  const reportId = createId("report")
  const recommendationInput = buildRecommendationInput(input.analysis)
  const products = await listActiveRecommendationProducts()
  const recommendations = recommendAuroraProducts(recommendationInput, 3, products)
  const status: ScanStatus = input.analysis.source === "fallback" ? "fallback" : "analyzed"

  const scan = {
    id: scanId,
    userId: input.userId,
    source: input.source ?? "unknown",
    status,
    image: input.image,
    createdAt: now,
    updatedAt: now,
  }

  const report = {
    id: reportId,
    scanId,
    userId: input.userId,
    analysis: {
      ...input.analysis,
      recommendations: recommendations.map((match) => ({
        title: match.product.name,
        reason: match.reasons.join(" "),
        category: match.product.category,
        imagePath: match.product.imagePath,
      })),
      disclaimer: input.analysis.disclaimer || RECOMMENDATION_DISCLAIMER,
    },
    recommendations,
    fallbackReason: input.fallbackReason,
    createdAt: now,
    updatedAt: now,
  }

  const bundle = await saveReportBundle({ scan, report })

  await saveAiProviderEvent({
    provider: input.analysis.source === "gemini" || input.aiProviderReason ? "gemini" : "fallback",
    model: input.analysis.model,
    status: input.analysis.source === "fallback" ? "fallback" : "success",
    scanId,
    reportId,
    reason: input.aiProviderReason ?? input.fallbackReason,
  })

  await saveAuditLog({
    action: "Created cosmetic report",
    targetType: "report",
    targetId: reportId,
  })

  return bundle
}

function buildRecommendationInput(analysis: ScanAnalysisReport): CosmeticAnalysisInput {
  const input: CosmeticAnalysisInput = {
    hydration: "balanced",
    texture: "balanced",
    rednessAppearance: "balanced",
    pigmentationAppearance: "balanced",
    radiance: "mild",
    daytimeProtection: "mild",
    routinePreference: "standard",
  }

  for (const finding of analysis.cosmeticFindings) {
    const concern = FINDING_CONCERN_MAP[finding.label.toLowerCase()]
    if (!concern || !isRecommendationBand(finding.band)) continue
    input[concern] = finding.band
  }

  return input
}

function isRecommendationBand(value: string): value is NonNullable<CosmeticAnalysisInput[SkinConcern]> {
  return ["low", "balanced", "mild", "moderate", "elevated", "not_visible"].includes(value)
}
