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
