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

// Runtime-checkable mirror of the SkinConcern union — form input, JSON
// columns, and Ingredient.concerns all arrive as plain strings that need
// validating against real concern values rather than trusted as-is. Single
// shared source (lib/backend/product-service.ts and
// lib/products/ingredients/repository.ts both import this) instead of each
// maintaining its own copy that could drift.
export const SKIN_CONCERNS = [
  "hydration",
  "texture",
  "rednessAppearance",
  "pigmentationAppearance",
  "oilBalance",
  "barrierComfort",
  "radiance",
  "daytimeProtection",
] as const satisfies readonly SkinConcern[]

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
  // Optional live UV index (from lib/climate/adapter.ts's ClimateSnapshot,
  // via lib/backend/scan-service.ts) — separate from `climate` above since
  // "high UV" and "dry/humid/cold/hot" are independent axes (e.g. a cold,
  // dry, high-UV day at altitude). Undefined whenever climate data wasn't
  // fetched for a scan (location declined/unavailable, or Open-Meteo
  // failed) — existing matching is unaffected when this is absent.
  uvIndex?: number
  routinePreference?: "minimal" | "standard" | "complete"
  // Optional traditional Ayurvedic dosha result (from lib/dosha/, via
  // lib/backend/scan-service.ts) — a plain "vata"/"pitta"/"kapha" string
  // rather than importing lib/dosha's own Dosha type, so this module stays
  // decoupled from that feature's internals (per AGENTS.md: features
  // shouldn't import each other's internals). Undefined whenever the user
  // has no saved DoshaProfile — existing concern/climate matching is
  // completely unaffected either way, same as climate being absent.
  dosha?: { primary: string; secondary?: string }
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

// One row from the Ingredient table, resolved for a specific product —
// populated once by lib/backend/product-service.ts's mapProduct (a single
// query with the Product<->Ingredient relation included), so every
// downstream consumer (report card chips, chat cards, recommendation
// scoring) just reads plain data instead of each doing its own lookup.
// Notably this is what makes ChatProductCard (a client component, inside a
// "use client" chat tree) able to show ingredient tooltips without itself
// touching Prisma or becoming async.
export type IngredientDetail = {
  name: string
  description: string
  concerns: SkinConcern[]
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
  // Plain ingredient names — unchanged shape/meaning from before the
  // Ingredient table existed, so gemini-adapter.ts/chat routes/
  // match-allergies.ts/the admin product table all keep working exactly as
  // they did. Derived from `ingredientDetails` below wherever a real
  // Ingredient relation is available.
  keyIngredients?: string[]
  // Description + concerns per recognized ingredient — absent (not just
  // empty) whenever a product's ingredients haven't been resolved against
  // the Ingredient table (e.g. static fixtures in tests).
  ingredientDetails?: IngredientDetail[]
  // Traditional Ayurvedic dosha relevance ("vata"/"pitta"/"kapha") — see
  // Product.doshaTags's schema comment. Additive input to the dosha bonus
  // in recommendation-engine.ts; empty/absent just means no bonus applies.
  doshaTags?: string[]
  officialUrl?: string
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
