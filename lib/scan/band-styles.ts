import type { AnimatedBadgeStatus } from "@/components/motion/animated-badge"
import type { AssessmentBand } from "@/lib/scan/types"

const BAND_CHIP_CLASS: Record<AssessmentBand, string> = {
  minimal: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  mild: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  moderate: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  elevated: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  not_assessed: "border-border bg-muted/50 text-muted-foreground",
}

const BAND_CARD_ACCENT_CLASS: Record<AssessmentBand, string> = {
  minimal: "border-l-chart-1",
  mild: "border-l-chart-2",
  moderate: "border-l-chart-3",
  elevated: "border-l-chart-4",
  not_assessed: "border-l-muted-foreground/40",
}

const BAND_ANIMATED_STATUS: Record<AssessmentBand, AnimatedBadgeStatus> = {
  minimal: "success",
  mild: "info",
  moderate: "warning",
  elevated: "danger",
  not_assessed: "neutral",
}

export function getBandChipClass(band: AssessmentBand) {
  return BAND_CHIP_CLASS[band]
}

export function getBandCardAccentClass(band: AssessmentBand) {
  return BAND_CARD_ACCENT_CLASS[band]
}

export function getBandAnimatedStatus(band: AssessmentBand) {
  return BAND_ANIMATED_STATUS[band]
}
