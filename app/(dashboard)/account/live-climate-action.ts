"use server"

// On-demand live weather check for the Climate settings tab — a genuinely
// new, independent location-consent moment (the browser's own Geolocation
// permission prompt), entirely separate from the mandatory per-scan
// location gate (app/api/scan/analyze/route.ts / components/scan/
// ScanFlow.tsx). Re-checks the session here since server actions are
// callable directly, same reasoning as allergies-actions.ts.
//
// Nothing here is ever written anywhere: lat/lon only exist for the
// duration of this call, and the returned snapshot only ever flows back to
// the caller for that one page view. getClimateSnapshot() is reused
// unmodified — including its own short-TTL, coordinate-rounded, not-
// person-keyed in-memory cache, a pre-existing behavior this doesn't add
// to or change.
import { getClimateSnapshot } from "@/lib/climate/adapter"
import { interpretClimate } from "@/lib/climate/interpret"
import { computeComfortScore, getComfortBand, type ComfortBand } from "@/lib/reports/comfort-score"
import { getSession } from "@/lib/auth/session"

export type LiveClimateResult = {
  temperatureC: number
  humidityPercent: number
  uvIndex: number
  comfortBand: ComfortBand
  interpretiveSentences: string[]
}

export async function getLiveClimateSnapshot(
  lat: number,
  lon: number,
): Promise<{ success: true; climate: LiveClimateResult } | { success: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be signed in to check live conditions." }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { success: false, error: "That location doesn't look valid. Try again." }
  }

  const snapshot = await getClimateSnapshot(lat, lon)
  if (!snapshot) {
    return { success: false, error: "Couldn't fetch live weather right now. Try again in a moment." }
  }

  // No scan/findings context on this standalone settings page, so this is
  // a climate-only Comfort Score — computeComfortScore's finding-
  // aggravation terms simply don't fire with an empty findings array (see
  // its own doc comment). Same formula components/report/sections/
  // climate-conditions.tsx uses on a real report, not a second calculation.
  const comfortScore = computeComfortScore(snapshot, [])

  return {
    success: true,
    climate: {
      temperatureC: snapshot.temperatureC,
      humidityPercent: snapshot.humidityPercent,
      uvIndex: snapshot.uvIndex,
      comfortBand: getComfortBand(comfortScore),
      interpretiveSentences: interpretClimate(snapshot),
    },
  }
}
