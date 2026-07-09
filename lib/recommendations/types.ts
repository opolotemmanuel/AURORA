// Types for the rule-based Aurora product recommendation engine — separate
// from lib/backend/types.ts since recommendations are their own domain
// (matching cosmetic findings to products), reused by both the scan flow
// and the /api/recommendations route.
export type CosmeticBand = "low" | "balanced" | "mild" | "moderate" | "elevated" | "not_visible"

export type SkinConcern =
  | "hydration"
  | "texture"
  | "rednessAppearance"
  | "pigmentationAppearance"
  | "oilBalance"
  | "barrierComfort"
  | "radiance"
  | "daytimeProtection"

export type RoutineStep = "cleanse" | "treat" | "moisturize" | "protect"

export type SkinProfile = "dry-feeling" | "balanced" | "oil-prone" | "sensitive-feeling" | "dull-looking"

export type CosmeticAnalysisInput = {
  hydration?: CosmeticBand
  texture?: CosmeticBand
  rednessAppearance?: CosmeticBand
  pigmentationAppearance?: CosmeticBand
  oilBalance?: CosmeticBand
  barrierComfort?: CosmeticBand
  radiance?: CosmeticBand
  daytimeProtection?: CosmeticBand
  skinProfile?: SkinProfile
  climate?: "dry" | "humid" | "cold" | "hot" | "temperate"
  routinePreference?: "minimal" | "standard" | "complete"
}

export type CosmeticFindingInput = {
  concern: SkinConcern
  band: CosmeticBand
  observation?: string
}

export type RecommendationAnalysisInput = {
  findings?: CosmeticFindingInput[]
  signals?: Partial<Record<SkinConcern, CosmeticBand>>
  skinProfile?: SkinProfile
}

export type RecommendationContext = {
  scanId?: string
  reportId?: string
  userId?: string
  climate?: CosmeticAnalysisInput["climate"]
}

export type RecommendationPreferences = {
  routinePreference?: CosmeticAnalysisInput["routinePreference"]
  limit?: number
}

// `id` is the stable slug (used in URLs/matching logic); `databaseId` is the
// Prisma row id, only present once the product actually exists in Postgres
// (see lib/backend/product-service.ts's mapProduct). Keep this distinction
// in mind when reading report-store.ts, which stores both separately.
export type AuroraProduct = {
  id: string
  databaseId?: string
  name: string
  category: string
  routineStep: RoutineStep
  shortDescription: string
  imagePath?: string
  cosmeticBenefits: string[]
  bestFor: SkinConcern[]
  avoidIf?: SkinConcern[]
  priority: number
  active?: boolean
}

export type RecommendationMatch = {
  product: AuroraProduct
  score: number
  rank: number
  matchStrength: "primary" | "supporting" | "optional"
  reasons: string[]
  routineStep: RoutineStep
}

export type RecommendationRequest = {
  analysis: RecommendationAnalysisInput
  context?: RecommendationContext
  preferences?: RecommendationPreferences
}

// Older, flatter request shape (analysis as a flat CosmeticAnalysisInput)
// kept alongside RecommendationRequest above for backward compatibility.
// app/api/recommendations/route.ts accepts either shape and normalizes both
// down to a plain CosmeticAnalysisInput before calling the engine, which
// only ever knows about that flat shape — recommendation-engine.ts itself
// has no awareness of findings[]/signals or the legacy/standard split.
export type LegacyRecommendationRequest = {
  analysis: CosmeticAnalysisInput
  limit?: number
}

export type RecommendationResponse = {
  success: true
  source: "rule-based"
  disclaimer: string
  recommendations: RecommendationMatch[]
  routine: RecommendationMatch[]
  nextBackendStep: string
}

export type RecommendationErrorResponse = {
  success: false
  error: string
}
