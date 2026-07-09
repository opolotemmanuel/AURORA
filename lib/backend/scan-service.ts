// Turns a completed cosmetic analysis (already produced by the Gemini
// adapter or its fallback — see app/api/scan/analyze/route.ts, which is
// where that call actually happens) into a persisted report: attaches
// matched Aurora product recommendations, saves the scan+report bundle, and
// records audit/AI-provider events. This module never calls Gemini itself.
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

// The Gemini adapter returns free-text finding labels; the recommendation
// engine only understands a fixed set of SkinConcern keys. This bridges the
// two vocabularies (lowercased label -> concern key). Exported so
// lib/reports/report-view-model.ts can group findings by concern using the
// exact same vocabulary, instead of a second mapping that could drift.
export const FINDING_CONCERN_MAP: Record<string, SkinConcern> = {
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
  userAgent?: string
  aiDurationMs?: number
}): Promise<StoredReportBundle> {
  const now = new Date().toISOString()
  const scanId = createId("scan")
  const reportId = createId("report")
  // Recommendations are computed here (not by the AI adapter) so the
  // product catalog can change independently of what the model returns.
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
    quality: input.analysis.quality,
    userAgent: input.userAgent,
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

  // Separate from the audit log below: this tracks AI provider reliability
  // (success/fallback rate per model) for the admin analytics dashboard,
  // not "who did what" for privacy auditing.
  await saveAiProviderEvent({
    provider: input.analysis.source === "gemini" || input.aiProviderReason ? "gemini" : "fallback",
    model: input.analysis.model,
    status: input.analysis.source === "fallback" ? "fallback" : "success",
    scanId,
    reportId,
    reason: input.aiProviderReason ?? input.fallbackReason,
    durationMs: input.aiDurationMs,
  })

  await saveAuditLog({
    action: "Created cosmetic report",
    targetType: "report",
    targetId: reportId,
  })

  return bundle
}

// Starts from neutral/default bands, then overlays whatever the analysis
// actually found — so a finding the model didn't report (or reported with
// an unrecognized label/band) just falls back to a safe neutral value
// instead of skewing recommendations.
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

// Narrows a finding's free-form `band: string` down to the specific literal
// union the recommendation engine expects, guarding against a model
// returning a band string that isn't one of the app's allowed values.
function isRecommendationBand(value: string): value is NonNullable<CosmeticAnalysisInput[SkinConcern]> {
  return ["low", "balanced", "mild", "moderate", "elevated", "not_visible"].includes(value)
}
