import type { SkinAssessment } from "@/lib/scan/types"
import type { UsageInput } from "@/lib/tokens/pricing"

export type CatalogProductContext = {
  slug: string
  name: string
  description: string
  category: string
  ingredients: string | null
  targetConcerns: string[]
  suitableSkinTypes: string[]
  climateTags: string[]
}

export type UserScanContext = {
  profile: {
    ageBand: string | null
    skinType: string | null
    fitzpatrickBand: string | null
    primaryConcerns: string[]
    skinGoals: string[]
    allergies: string | null
    currentRoutine: unknown
    lifestyleFactors: unknown
  } | null
  location: {
    city: string | null
    region: string | null
    country: string | null
    uvIndexBand: string | null
    humidityBand: string | null
    temperatureBand: string | null
    climateZone: string | null
    seasonBand: string | null
  } | null
}

export type AnalyzeSkinInput = {
  userId: string
  image: Buffer
  mimeType: string
  model: {
    provider: UsageInput["provider"]
    modelId: string
    displayName: string | null
  }
  catalog: CatalogProductContext[]
  userContext: UserScanContext
}

export type AnalyzeSkinResult = {
  assessment: SkinAssessment
  usage: UsageInput
  latencyMs: number
}
