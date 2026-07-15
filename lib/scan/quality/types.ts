// Shared types for the live pre-capture quality checklist (Capture step —
// components/scan/ScanFlow.tsx). Pure types only, safe to import from
// either the client-only landmark/canvas modules or the UI panel.
//
// "gate" checks block the Capture button until satisfied; "warning" checks
// are shown but never block — same tiering the spec calls for, so every
// check's severity is explicit and can't quietly drift between the two.
export type QualityCheckSeverity = "gate" | "warning"

export type QualityStatus = "pass" | "warn" | "fail"

export type QualityCheckId =
  | "faceCount"
  | "facePosition"
  | "lighting"
  | "sharpness"
  | "stability"
  | "resolution"
  | "eyeVisibility"
  | "faceRotation"
  | "occlusion"
  | "expression"
  | "background"
  | "skinVisibility"

export type QualityCheckResult = {
  id: QualityCheckId
  severity: QualityCheckSeverity
  status: QualityStatus
  label: string
  /** Short, user-facing guidance — directional where possible (e.g. "Move closer"). */
  message: string
}

export type QualitySnapshot = {
  results: QualityCheckResult[]
  score: number
  scoreBand: "Poor" | "Fair" | "Good" | "Excellent"
  /** True once every "gate" check has status "pass" — the single source of truth for enabling Capture. */
  readyToCapture: boolean
}
