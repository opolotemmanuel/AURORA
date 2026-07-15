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
import type { ClimateSnapshot } from "@/lib/climate/adapter"
import { getDoshaProfile, type StoredDoshaProfile } from "@/lib/dosha/dosha-store"
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
  "pigmentation appearance": "pigmentationAppearance",
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
  // Transient only — the raw lat/lon never reach this function (see
  // app/api/scan/analyze/route.ts, which fetches this from lib/climate/
  // adapter.ts and discards the coordinates immediately after). Nothing
  // below persists this snapshot: it only shapes this one call's
  // recommendation scoring, per AGENTS.md's privacy-by-design rule.
  climate?: ClimateSnapshot | null
}): Promise<StoredReportBundle> {
  const now = new Date().toISOString()
  const scanId = createId("scan")
  const reportId = createId("report")
  // Optional and additive, same as climate: a signed-in user with no saved
  // DoshaProfile (the common case — the questionnaire is opt-in) simply
  // gets `dosha: undefined` below, so recommendation-engine.ts's dosha
  // bonus doesn't fire and scoring is identical to before this feature
  // existed. Anonymous scans (no userId) never look this up at all.
  const doshaProfile = input.userId ? await getDoshaProfile(input.userId) : null
  // Recommendations are computed here (not by the AI adapter) so the
  // product catalog can change independently of what the model returns.
  const recommendationInput = buildRecommendationInput(input.analysis, input.climate, doshaProfile)
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
      // Tags each finding with its concern key (same FINDING_CONCERN_MAP
      // used for scoring above) before persistence — report-store.ts writes
      // this straight to ReportFinding.concern. Previously left unset here,
      // so that column was always null; lib/reports/report-view-model.ts
      // re-derives the same mapping at read time so this wasn't visibly
      // broken, but a null column that's supposed to hold this is worth
      // fixing while touching this exact vocabulary.
      cosmeticFindings: input.analysis.cosmeticFindings.map((finding) => ({
        ...finding,
        concern: FINDING_CONCERN_MAP[finding.label.toLowerCase()],
      })),
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
    // Persisted as the one-time ClimateReading row (readings only, never the
    // coordinates that produced them — see prisma/schema.prisma). `undefined`
    // when Open-Meteo failed or returned nothing, matching the existing
    // "absent means inert" pattern the rest of this function already uses
    // for climate (see deriveClimateSignals above).
    climate: input.climate ?? undefined,
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

// Only sets a concern when the analysis actually reported one — a finding
// the model didn't report (or reported with an unrecognized label/band)
// stays unset, so recommendation-engine.ts's `if (!band) continue` skips it
// entirely (true zero weight). This used to pre-seed every concern with a
// hardcoded "balanced"/"mild" band before overlaying real findings, on the
// theory that those were "safe neutral values" — they weren't:
// BAND_WEIGHT["balanced"] is 6 and BAND_WEIGHT["mild"] is 18, not 0, so an
// unreported concern was silently scored as if it were a real mild/balanced
// finding. Gemini doesn't consistently return a "Radiance" finding, so
// `radiance` defaulted to "mild" (+18) on most scans — and because the
// catalog's three highest-priority products (radiant-plump-serum,
// gold-serum, radiant-plump-moisturizer-with-glutathione) all target
// radiance, they picked up that same +18 almost every time regardless of
// the actual scan, on top of already having the highest base priority in
// the whole catalog. That combination made them win the top-3 ranking in
// effectively every case — confirmed by hand-replaying real historical
// scans (see git history / PR discussion for the specific report ids and
// scores): a "balanced/balanced/not_visible/balanced" scan and a
// "not_visible/not_visible/not_visible/not_visible" (unreadable image) scan
// both scored these same three products to the same top-3 ranking, purely
// from the shared default bonus and priority, with zero real signal
// difference reaching the scorer.
function buildRecommendationInput(
  analysis: ScanAnalysisReport,
  climate?: ClimateSnapshot | null,
  doshaProfile?: StoredDoshaProfile | null,
): CosmeticAnalysisInput {
  const input: CosmeticAnalysisInput = {
    routinePreference: "standard",
    ...deriveClimateSignals(climate),
    ...deriveDoshaSignal(doshaProfile),
  }

  for (const finding of analysis.cosmeticFindings) {
    const concern = FINDING_CONCERN_MAP[finding.label.toLowerCase()]
    if (!concern || !isRecommendationBand(finding.band)) continue
    input[concern] = finding.band
  }

  return input
}

// Mirrors deriveClimateSignals below: turns the stored DoshaProfile shape
// into the recommendation engine's plain-string `dosha` signal. No profile
// (the common case) means this key stays unset entirely, so
// recommendation-engine.ts's dosha bonus simply doesn't fire — identical to
// how an absent climate snapshot leaves climate-based scoring inert.
function deriveDoshaSignal(doshaProfile?: StoredDoshaProfile | null): Pick<CosmeticAnalysisInput, "dosha"> {
  if (!doshaProfile) return {}

  return {
    dosha: {
      primary: doshaProfile.primaryDosha,
      secondary: doshaProfile.secondaryDosha ?? undefined,
    },
  }
}

// Turns a raw ClimateSnapshot into the recommendation engine's coarse
// vocabulary (CosmeticAnalysisInput's `climate` category + `uvIndex`).
// Dry/humid checked before cold/hot: low or high humidity is a stronger,
// more direct driver of skincare needs (barrier/hydration) than ambient
// temperature alone, so it takes priority when a reading could arguably
// fit either bucket. Returns {} (both fields undefined) when there's no
// snapshot — buildRecommendationInput's spread then leaves climate/uvIndex
// unset entirely, so recommendation-engine.ts's climate-based scoring
// simply doesn't fire, same as before this feature existed. Location is now
// required to reach this call at all (see app/api/scan/analyze/route.ts's
// parseScanCoordinates), so `climate` being null here means Open-Meteo
// itself failed (network/timeout/unexpected shape) — this graceful branch
// still exists and still matters for that case, it's just no longer
// reachable via "user skipped location."
function deriveClimateSignals(
  climate?: ClimateSnapshot | null,
): Pick<CosmeticAnalysisInput, "climate" | "uvIndex"> {
  if (!climate) return {}

  const { temperatureC, humidityPercent, uvIndex } = climate

  let category: CosmeticAnalysisInput["climate"] = "temperate"
  if (humidityPercent < 30) category = "dry"
  else if (humidityPercent > 65) category = "humid"
  else if (temperatureC < 10) category = "cold"
  else if (temperatureC > 28) category = "hot"

  return { climate: category, uvIndex }
}

// Narrows a finding's free-form `band: string` down to the specific literal
// union the recommendation engine expects, guarding against a model
// returning a band string that isn't one of the app's allowed values.
function isRecommendationBand(value: string): value is NonNullable<CosmeticAnalysisInput[SkinConcern]> {
  return ["low", "balanced", "mild", "moderate", "elevated", "not_visible"].includes(value)
}
