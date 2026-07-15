// Skin Comfort Score — a deterministic, rule-based 0-100 figure combining
// today's climate reading with the scan's own cosmetic findings. This is an
// interpretive wellness construct, not a real medical/scientific measure —
// see AGENTS.md's "cosmetic framing everywhere" non-negotiable. It's
// computed live on every render (never stored — see prisma/schema.prisma's
// ClimateReading, which holds only the raw readings this formula runs
// against) and, per AGENTS.md's "coarse, honest output only" rule, the raw
// number is an internal computation detail: callers should display the band
// (Poor/Moderate/Good/Excellent) via getComfortBand, the same convention
// lib/reports/band-visuals.ts already uses for every other report score.
//
// Formula (documented here since this number has no external source to
// point to — it's this file's own invention):
//
//   Start at 100 ("fully comfortable" conditions, no penalties).
//
//   Climate-only penalties (each independent; humidity and temperature are
//   mutually exclusive within themselves, UV is separate):
//     humidity < 30%        -15  (dry air stresses the skin barrier)
//     humidity > 65%         -8  (humid air stresses oil balance)
//     temperature > 28°C    -10  (heat/sweat can aggravate concerns)
//     temperature < 10°C    -10  (cold strips moisture)
//     uvIndex >= 6          -12  (meaningful UV exposure risk)
//
//   Compounding penalty — applied only when an existing finding is already
//   in a "moderate" or "elevated" band AND today's climate would plausibly
//   aggravate that specific concern (dry/hot skies aggravate hydration
//   concerns; hot/high-UV days aggravate redness/sensitivity concerns):
//     hydration finding moderate/elevated AND (humidity<30 or temp>28)  -10
//     rednessAppearance finding moderate/elevated AND (uvIndex>=6 or temp>28) -10
//
//   Final score = clamp(100 - sum(penalties), 0, 100).
import type { ClimateSnapshot } from "@/lib/climate/adapter"
import type { ReportFinding } from "@/lib/backend/types"

const LOW_HUMIDITY_THRESHOLD = 30
const HIGH_HUMIDITY_THRESHOLD = 65
const COLD_THRESHOLD_C = 10
const HOT_THRESHOLD_C = 28
const HIGH_UV_THRESHOLD = 6

const AGGRAVATED_BANDS = new Set(["moderate", "elevated"])

export type ComfortBand = "Poor" | "Moderate" | "Good" | "Excellent"

export function computeComfortScore(climate: ClimateSnapshot, findings: ReportFinding[]): number {
  let score = 100

  const isDry = climate.humidityPercent < LOW_HUMIDITY_THRESHOLD
  const isHumid = climate.humidityPercent > HIGH_HUMIDITY_THRESHOLD
  const isHot = climate.temperatureC > HOT_THRESHOLD_C
  const isCold = climate.temperatureC < COLD_THRESHOLD_C
  const isHighUv = climate.uvIndex >= HIGH_UV_THRESHOLD

  if (isDry) score -= 15
  else if (isHumid) score -= 8

  if (isHot) score -= 10
  else if (isCold) score -= 10

  if (isHighUv) score -= 12

  const bandFor = (concern: string) =>
    findings.find((finding) => finding.concern === concern)?.band

  if (AGGRAVATED_BANDS.has(bandFor("hydration") ?? "") && (isDry || isHot)) {
    score -= 10
  }

  if (AGGRAVATED_BANDS.has(bandFor("rednessAppearance") ?? "") && (isHighUv || isHot)) {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

export function getComfortBand(score: number): ComfortBand {
  if (score >= 85) return "Excellent"
  if (score >= 65) return "Good"
  if (score >= 40) return "Moderate"
  return "Poor"
}
