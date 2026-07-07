import type {
  AuroraProduct,
  CosmeticAnalysisInput,
  CosmeticBand,
  RecommendationMatch,
  SkinConcern,
} from "./types"

export const RECOMMENDATION_DISCLAIMER =
  "Aurora recommendations are cosmetic wellness guidance only and are not a medical diagnosis, treatment plan, or substitute for professional medical advice."

const CONCERN_LABELS: Record<SkinConcern, string> = {
  hydration: "hydration appearance",
  texture: "visible texture",
  rednessAppearance: "redness appearance",
  pigmentationAppearance: "uneven tone appearance",
  oilBalance: "oil balance",
  barrierComfort: "barrier comfort",
  radiance: "radiance",
  daytimeProtection: "daytime routine protection",
}

const BAND_WEIGHT: Record<CosmeticBand, number> = {
  elevated: 38,
  moderate: 30,
  mild: 18,
  low: 14,
  balanced: 6,
  not_visible: 0,
}

export function recommendAuroraProducts(
  analysis: CosmeticAnalysisInput,
  limit = 3,
  products: AuroraProduct[] = [],
): RecommendationMatch[] {
  const normalizedLimit = Math.max(1, Math.min(limit, products.length))
  const concernSignals = getConcernSignals(analysis)

  const matches = products
    .map((product) => scoreProduct(product, concernSignals, analysis))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || b.product.priority - a.product.priority)
    .slice(0, normalizedLimit)
    .map((match, index) => ({
      ...match,
      rank: index + 1,
      matchStrength: getMatchStrength(index),
    }))

  if (matches.length > 0) return matches

  return products
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .slice(0, normalizedLimit)
    .map((product, index) => ({
      product,
      score: product.priority,
      rank: index + 1,
      matchStrength: getMatchStrength(index),
      reasons: ["General Aurora routine support when cosmetic scan signals are limited."],
      routineStep: product.routineStep,
    }))
}

export function buildRoutine(recommendations: RecommendationMatch[]) {
  const stepOrder = ["cleanse", "treat", "moisturize", "protect"] as const

  return stepOrder.flatMap((step) => recommendations.filter((item) => item.routineStep === step).slice(0, 1))
}

function scoreProduct(
  product: AuroraProduct,
  concernSignals: Partial<Record<SkinConcern, CosmeticBand>>,
  analysis: CosmeticAnalysisInput,
): Omit<RecommendationMatch, "rank" | "matchStrength"> {
  const reasons: string[] = []
  let score = product.priority

  for (const concern of product.bestFor) {
    const band = concernSignals[concern]
    if (!band) continue

    const weight = BAND_WEIGHT[band]
    score += weight

    if (weight >= 18) {
      reasons.push(`Matches ${CONCERN_LABELS[concern]} marked as ${formatBand(band)}.`)
    }
  }

  for (const concern of product.avoidIf ?? []) {
    const band = concernSignals[concern]
    if (band === "moderate" || band === "elevated") {
      score -= 22
      reasons.push(`Kept lower because ${CONCERN_LABELS[concern]} appears more prominent.`)
    }
  }

  score += getProfileAdjustment(product, analysis)

  if (analysis.climate === "dry" && product.bestFor.includes("hydration")) {
    score += 12
    reasons.push("Supports a dry-climate cosmetic routine.")
  }

  if (analysis.routinePreference === "minimal" && product.routineStep === "treat") {
    score += 8
  }

  if (reasons.length === 0) {
    reasons.push("Supports a balanced Aurora cosmetic routine.")
  }

  return {
    product,
    score,
    reasons,
    routineStep: product.routineStep,
  }
}

function getConcernSignals(analysis: CosmeticAnalysisInput): Partial<Record<SkinConcern, CosmeticBand>> {
  return {
    hydration: analysis.hydration,
    texture: analysis.texture,
    rednessAppearance: analysis.rednessAppearance,
    pigmentationAppearance: analysis.pigmentationAppearance,
    oilBalance: analysis.oilBalance,
    barrierComfort: analysis.barrierComfort,
    radiance: analysis.radiance,
    daytimeProtection: analysis.daytimeProtection,
  }
}

function getProfileAdjustment(product: AuroraProduct, analysis: CosmeticAnalysisInput) {
  if (analysis.skinProfile === "dry-feeling" && product.bestFor.includes("hydration")) return 14
  if (analysis.skinProfile === "sensitive-feeling" && product.bestFor.includes("barrierComfort")) return 14
  if (analysis.skinProfile === "oil-prone" && product.bestFor.includes("oilBalance")) return 14
  if (analysis.skinProfile === "dull-looking" && product.bestFor.includes("radiance")) return 14
  return 0
}

function getMatchStrength(index: number): RecommendationMatch["matchStrength"] {
  if (index === 0) return "primary"
  if (index === 1) return "supporting"
  return "optional"
}

function formatBand(band: CosmeticBand) {
  return band.replace("_", " ")
}
