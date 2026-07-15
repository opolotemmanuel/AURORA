// Deterministic, rule-based interpretive text for a ClimateReading — no AI
// call, no invented numeric claims (e.g. never fabricate "reapply every 2
// hours" as if it were personalized). Thresholds intentionally mirror
// lib/backend/scan-service.ts's deriveClimateSignals (humidity/temperature
// bucketing) and lib/recommendations/recommendation-engine.ts's UV rule, so
// this text never contradicts what actually drove the recommendations shown
// alongside it. General, well-established skincare framing only — cosmetic,
// not medical (see AGENTS.md's non-negotiables).
import type { ClimateSnapshot } from "@/lib/climate/adapter"

const LOW_HUMIDITY_THRESHOLD = 30
const HIGH_HUMIDITY_THRESHOLD = 65
const COLD_THRESHOLD_C = 10
const HOT_THRESHOLD_C = 28
const HIGH_UV_THRESHOLD = 6

// Only returns a sentence for a condition that actually crosses a
// threshold — a mild, unremarkable reading (e.g. 45% humidity, 20°C, UV 3)
// produces an empty array rather than a padded, always-present sentence for
// every field. Callers show a neutral fallback line when this is empty (see
// components/report/sections/climate-conditions.tsx).
export function interpretClimate(climate: ClimateSnapshot): string[] {
  const sentences: string[] = []

  if (climate.humidityPercent < LOW_HUMIDITY_THRESHOLD) {
    sentences.push(
      "Low humidity today may increase moisture loss and make your skin feel drier than usual."
    )
  } else if (climate.humidityPercent > HIGH_HUMIDITY_THRESHOLD) {
    sentences.push(
      "High humidity today can leave skin feeling oilier or congested, especially in oil-prone areas."
    )
  }

  if (climate.temperatureC > HOT_THRESHOLD_C) {
    sentences.push(
      "Warmer temperatures today can increase sweating and water loss — staying hydrated and using lightweight products may help."
    )
  } else if (climate.temperatureC < COLD_THRESHOLD_C) {
    sentences.push(
      "Colder temperatures today can strip moisture and irritate a sensitive barrier — a richer moisturizer may feel more comfortable."
    )
  }

  if (climate.uvIndex >= HIGH_UV_THRESHOLD) {
    sentences.push(
      "UV exposure is high today — consider SPF and limiting prolonged direct sun exposure."
    )
  }

  return sentences
}
