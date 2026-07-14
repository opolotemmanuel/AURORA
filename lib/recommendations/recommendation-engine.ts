// Pure, rule-based product scoring — no AI/network calls, no request
// parsing. Only ever works with the flat CosmeticAnalysisInput shape;
// normalizing the richer findings[]/signals request shapes into that flat
// form is the API route's job (app/api/recommendations/route.ts), not this
// module's.
import type {
  AuroraProduct,
  CosmeticAnalysisInput,
  CosmeticBand,
  RecommendationMatch,
  SkinConcern,
} from "./types"

export const RECOMMENDATION_DISCLAIMER =
  "Aurora recommendations are cosmetic wellness guidance only and are not a medical diagnosis, treatment plan, or substitute for professional medical advice."

// Human-readable phrasing for each concern, used only in the `reasons` text
// shown to the user — not used for scoring itself.
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

// More severe bands score higher — a product addressing an "elevated"
// concern should outrank one addressing a "balanced" (i.e. barely present)
// one. "not_visible" contributes nothing since there's no visible concern
// to address.
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

  // Nothing scored above zero (e.g. analysis had no matching concerns, or
  // the catalog has no products targeting what was found) — rather than
  // returning nothing, fall back to the catalog's highest-priority products
  // so the user still sees a routine.
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

// Picks at most one product per routine step, in cleanse→treat→moisturize→
// protect order, from an already-ranked recommendation list — the "routine"
// shown to the user isn't just the top N matches, it's the top match per step.
export function buildRoutine(recommendations: RecommendationMatch[]) {
  const stepOrder = ["cleanse", "treat", "moisturize", "protect"] as const

  return stepOrder.flatMap((step) => recommendations.filter((item) => item.routineStep === step).slice(0, 1))
}

// Scores one product against the analysis: starts from the catalog's own
// priority, adds weight for each matching "bestFor" concern, subtracts for
// "avoidIf" concerns that are moderate/elevated, then layers on smaller
// contextual bonuses (skin profile, climate, routine preference).
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

  if (analysis.climate === "humid" && product.bestFor.includes("oilBalance")) {
    score += 10
    reasons.push("Supports a humid-climate cosmetic routine.")
  }

  if (analysis.climate === "cold" && product.bestFor.includes("barrierComfort")) {
    score += 10
    reasons.push("Supports a cold-climate barrier-comfort routine.")
  }

  // 6+ is where standard UV-index guidance starts recommending active sun
  // protection ("high" on the common 0-11+ scale) — a coarse threshold,
  // not a precise medical cutoff, consistent with this app's bands-only
  // cosmetic framing.
  if (
    typeof analysis.uvIndex === "number" &&
    analysis.uvIndex >= 6 &&
    product.bestFor.includes("daytimeProtection")
  ) {
    score += 14
    reasons.push("Boosted for high local UV exposure today.")
  }

  if (analysis.routinePreference === "minimal" && product.routineStep === "treat") {
    score += 8
  }

  // Dosha bonus — same additive, never-overriding pattern as the climate
  // bonuses above, and smaller than a concern-band match (14-38) so a
  // dosha-based nudge can never outrank what the cosmetic scan actually
  // found. Only applies when the user has a saved DoshaProfile
  // (analysis.dosha is undefined otherwise); a secondary-dosha match is
  // weighted at half the primary's bonus, mirroring how a secondary dosha
  // itself is a lighter signal than the primary one.
  if (analysis.dosha && product.doshaTags?.length) {
    if (product.doshaTags.includes(analysis.dosha.primary)) {
      score += 12
      reasons.push(`Traditionally associated with your ${capitalize(analysis.dosha.primary)} dosha.`)
    } else if (analysis.dosha.secondary && product.doshaTags.includes(analysis.dosha.secondary)) {
      score += 6
      reasons.push(`Traditionally associated with your ${capitalize(analysis.dosha.secondary)} dosha.`)
    }
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
