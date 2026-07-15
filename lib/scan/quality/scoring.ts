// Composite quality score — a weighted rollup of every check's status, plus
// the single source of truth for whether Capture should be enabled.
//
// `readyToCapture` is deliberately computed from the hard-gate checks
// directly (every "gate" severity check must be "pass"), not merely
// inferred from the score crossing MINIMUM_CAPTURE_SCORE — with the
// weights below, a single failing gate already drags the score well under
// the threshold in practice, but capture must never depend on that being
// true by coincidence. The score threshold is an *additional* nudge (e.g.
// several soft warnings firing at once can still hold the score at the
// threshold even once every gate passes), not a replacement for the gates.
import type { QualityCheckResult, QualitySnapshot } from "./types"

// "Weighted higher than soft-warning ones" per spec — a failing gate check
// costs roughly 1.7x what a warning costs. First-pass values; tune
// alongside MINIMUM_CAPTURE_SCORE after real-device testing.
const GATE_WEIGHT = 10
const WARNING_WEIGHT = 6

// First-pass starting threshold, per the spec's own suggested example —
// same "expect real-world tuning" caveat as lib/scan/lighting.ts's
// original thresholds. With the weights above, this is calibrated so it
// only actually binds once several soft warnings are firing simultaneously
// even while every hard gate already passes (worst case: all gates pass,
// every warning shows "warn" -> score lands almost exactly on this line).
export const MINIMUM_CAPTURE_SCORE = 85

const SCORE_BANDS: Array<{ min: number; label: QualitySnapshot["scoreBand"] }> = [
  { min: 90, label: "Excellent" },
  { min: 75, label: "Good" },
  { min: 50, label: "Fair" },
  { min: 0, label: "Poor" },
]

export function computeQualitySnapshot(results: QualityCheckResult[]): QualitySnapshot {
  let earned = 0
  let total = 0

  for (const result of results) {
    const weight = result.severity === "gate" ? GATE_WEIGHT : WARNING_WEIGHT
    total += weight
    if (result.status === "pass") earned += weight
    else if (result.status === "warn") earned += weight * 0.5
    // "fail" contributes 0.
  }

  const score = total > 0 ? Math.round((earned / total) * 100) : 0
  const scoreBand = SCORE_BANDS.find((band) => score >= band.min)?.label ?? "Poor"
  const allGatesPass = results.every((result) => result.severity !== "gate" || result.status === "pass")

  return {
    results,
    score,
    scoreBand,
    readyToCapture: allGatesPass && score >= MINIMUM_CAPTURE_SCORE,
  }
}
