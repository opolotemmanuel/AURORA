// Shared domain types for the scan/report/admin backend. Kept separate from
// any one service file since scan-service, report-store, admin-analytics,
// etc. all need the same shapes.
import type { RecommendationMatch } from "@/lib/recommendations/types"

export type ScanSource = "camera" | "upload" | "unknown"
export type ScanStatus = "received" | "analyzed" | "fallback" | "failed"
export type ReportSource = "gemini" | "fallback" | "rule-based"
export type DownloadFormat = "print-html" | "pdf"
export type AdminRole = "owner" | "admin" | "operations" | "support" | "privacy"

// Deliberately does NOT include the image bytes themselves — only metadata.
// `stored` records whether the original photo was actually kept, since the
// default (per AGENTS.md's privacy rule) is to persist the report, not the
// photo.
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

// The report content itself, as produced by either the Gemini adapter or
// the rule-based fallback (see lib/backend/scan-service.ts) — this is what
// gets rendered to the user and persisted inside StoredReport below.
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

// A scan "attempt" — created as soon as an image is received, independent
// of whether analysis succeeds. `status` tracks it through the pipeline
// (received → analyzed/fallback/failed).
export type StoredScan = {
  id: string
  userId?: string
  source: ScanSource
  status: ScanStatus
  image: ScanImageMetadata
  createdAt: string
  updatedAt: string
}

// The persisted result of a scan. `analysis` is the report shown to the
// user; `recommendations` here is the richer, matched-product form (see
// lib/recommendations/types.ts) as opposed to the summarized
// CosmeticRecommendationSummary embedded inside `analysis.recommendations`.
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

// Admin-facing audit trail entry — one row per privacy/admin-relevant
// action (e.g. a download, an admin viewing a report).
export type AuditLogEntry = {
  id: string
  actorId?: string
  actorRole?: AdminRole
  action: string
  targetType: "scan" | "report" | "download" | "admin"
  targetId: string
  createdAt: string
}

// One row per AI call attempt, independent of AuditLogEntry — used to
// observe Gemini reliability (success/fallback/failed rate) on the admin
// analytics dashboard, not to audit user actions.
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

// Convenience pairing returned by lookups that need both the scan and its
// report together (e.g. building a download or a print view).
export type StoredReportBundle = {
  scan: StoredScan
  report: StoredReport
}
