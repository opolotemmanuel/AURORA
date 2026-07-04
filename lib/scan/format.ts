import type { AssessmentBand } from "@/lib/scan/types"

const BAND_LABEL: Record<AssessmentBand, string> = {
  minimal: "Minimal",
  mild: "Mild",
  moderate: "Moderate",
  elevated: "Elevated",
  not_assessed: "Not assessed",
}

const SKIN_HEADLINE: Record<AssessmentBand, string> = {
  minimal: "generally balanced and healthy-looking",
  mild: "mostly balanced with mild areas to support",
  moderate: "showing moderate cosmetic concerns in some areas",
  elevated: "showing elevated cosmetic concerns worth addressing",
  not_assessed: "not fully assessed in this scan",
}

export function formatBand(band: AssessmentBand) {
  return BAND_LABEL[band]
}

export function formatSkinHeadline(band: AssessmentBand) {
  return SKIN_HEADLINE[band]
}
