import type { RecommendationMatch } from "@/lib/recommendations/types"

export type ScanSource = "camera" | "upload" | "unknown"
export type ScanStatus = "received" | "analyzed" | "fallback" | "failed"
export type ReportSource = "gemini" | "fallback" | "rule-based"
export type DownloadFormat = "print-html" | "pdf"
export type AdminRole = "owner" | "admin" | "operations" | "support" | "privacy"

export type ScanImageMetadata = {
  fileName?: string
  mimeType?: string
  size?: number
  stored: boolean
}

export type ReportFinding = {
  label: string
  concern?: string
  band: string
  observation: string
}

export type ReportQuality = {
  lighting: string
  framing: string
  confidence: string
}

export type CosmeticRecommendationSummary = {
  title: string
  reason: string
  category?: string
  imagePath?: string
}

export type ScanAnalysisReport = {
  summary: string
  cosmeticFindings: ReportFinding[]
  recommendations: CosmeticRecommendationSummary[]
  routineTips: string[]
  quality: ReportQuality
  disclaimer: string
  source: "gemini" | "fallback"
  model: string
}

export type StoredScan = {
  id: string
  userId?: string
  source: ScanSource
  status: ScanStatus
  image: ScanImageMetadata
  createdAt: string
  updatedAt: string
}

export type StoredReport = {
  id: string
  scanId: string
  userId?: string
  analysis: ScanAnalysisReport
  recommendations: RecommendationMatch[]
  fallbackReason?: string
  createdAt: string
  updatedAt: string
}

export type ReportDownload = {
  id: string
  reportId: string
  format: DownloadFormat
  userId?: string
  userAgent?: string
  createdAt: string
}

export type AuditLogEntry = {
  id: string
  actorId?: string
  actorRole?: AdminRole
  action: string
  targetType: "scan" | "report" | "download" | "admin"
  targetId: string
  createdAt: string
}

export type AiProviderEvent = {
  id: string
  provider: string
  model: string
  status: "success" | "fallback" | "failed"
  scanId?: string
  reportId?: string
  reason?: string
  createdAt: string
}

export type StoredReportBundle = {
  scan: StoredScan
  report: StoredReport
}
