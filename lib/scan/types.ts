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

export type CaptureMode = "upload" | "camera"

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

export type ProductRecommendation = {
  id: string
  name: string
  reason: string
}

export type SkinAssessment = {
  overallBand: AssessmentBand
  dimensions: SkinDimension[]
  summary: string
  recommendations: ProductRecommendation[]
  disclaimer: string
}

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
