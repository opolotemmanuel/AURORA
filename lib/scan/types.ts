export type AssessmentBand =
  | "minimal"
  | "mild"
  | "moderate"
  | "elevated"
  | "not_assessed"

export type ScanWizardStep =
  | "capture"
  | "edit"
  | "quality"
  | "analyzing"
  | "results"

export type CaptureMode = "upload" | "camera" | "live"

export type ScanTier = "start" | "regular" | "pro"

export type LiveScanPayload = {
  transcript: string
  sessionDurationMs: number
}

export type LightingBand = "too_dark" | "ok" | "too_bright"

export type QualityCheckResult = {
  faceDetected: boolean
  faceCount: number
  faceCentered: boolean
  lightingScore: number
  lightingBand: LightingBand
  isPlausibleSkin: boolean
  issues: string[]
  passed: boolean
}

export type SkinDimension = {
  id: string
  label: string
  band: AssessmentBand
  note: string
}

export type ApplicationTime =
  | "morning"
  | "evening"
  | "anytime"
  | "morning_and_evening"

export type ApplicationFrequency =
  | "once_daily"
  | "twice_daily"
  | "as_needed"
  | "few_times_weekly"
  | "weekly"

export type NaturalRecommendation = {
  id: string
  title: string
  description: string
  applicationTime?: ApplicationTime
  applicationFrequency?: ApplicationFrequency
}

export type ProductRecommendation = {
  id: string
  name: string
  reason: string
  applicationTime?: ApplicationTime
  applicationFrequency?: ApplicationFrequency
  imageUrl?: string | null
  storeUrl?: string | null
}

export type SkinAssessment = {
  overallBand: AssessmentBand
  dimensions: SkinDimension[]
  summary: string
  naturalRecommendations: NaturalRecommendation[]
  recommendations: ProductRecommendation[]
  disclaimer: string
}

export type ScanClimateContext = {
  city: string | null
  region: string | null
  country: string | null
  uvIndexBand: string | null
  humidityBand: string | null
  temperatureBand: string | null
  climateZone: string | null
  seasonBand: string | null
  syncedAt: string | null
}

export type AnalyzeScanResult =
  | {
      ok: true
      assessment: SkinAssessment
      scanId: string
      reportId: string
      creditsCharged: number
      climateContext: ScanClimateContext | null
    }
  | { ok: false; error: string }

export type AnalysisToolCallStatus = "pending" | "running" | "done" | "error"

export type AnalysisToolCall = {
  id: string
  name: string
  label: string
  status: AnalysisToolCallStatus
  detail?: string
}

export type FaceDetection = {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}
