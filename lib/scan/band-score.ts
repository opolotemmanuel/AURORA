import type { AssessmentBand } from "@/lib/scan/types"

const BAND_SCORE: Record<AssessmentBand, number> = {
  not_assessed: 0,
  minimal: 1,
  mild: 2,
  moderate: 3,
  elevated: 4,
}

export function bandToScore(band: AssessmentBand): number {
  return BAND_SCORE[band] ?? 0
}

export function formatMicroUsd(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(4)}`
}
