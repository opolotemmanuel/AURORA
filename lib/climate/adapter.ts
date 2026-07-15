// One adapter for the Open-Meteo weather API (open-meteo.com) — same
// "one adapter per external service" pattern as lib/ai/gemini-adapter.ts and
// lib/email/adapter.ts. Open-Meteo's free forecast endpoint needs no API
// key/auth, so this is plain fetch(), no SDK. Entirely independent of the
// Gemini adapter — this never touches the app's Gemini API quota.
const OPEN_METEO_FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
const CLIMATE_FETCH_TIMEOUT_MS = 5000

// Short-TTL, in-memory weather cache — keyed ONLY on the rounded coordinate
// pair, never on userId/session, so it's shared across any user near that
// location rather than tracking an individual. Rounding to 1 decimal place
// (~11km) means nearby scans within the TTL window reuse one Open-Meteo call
// instead of each making their own. Plain module-level Map (no new
// package): resets on server restart/redeploy, which is an acceptable
// first-pass limitation — this is a performance optimization, not a
// correctness or privacy requirement, since nothing here is keyed to a
// person and losing the cache just means the next request re-fetches.
const CLIMATE_CACHE_TTL_MS = 15 * 60 * 1000
const COORDINATE_ROUNDING_DECIMALS = 1

const climateCache = new Map<string, { snapshot: ClimateSnapshot; expiresAt: number }>()

function roundedCoordinateKey(latitude: number, longitude: number): string {
  const factor = 10 ** COORDINATE_ROUNDING_DECIMALS
  const roundedLat = Math.round(latitude * factor) / factor
  const roundedLon = Math.round(longitude * factor) / factor
  return `${roundedLat},${roundedLon}`
}

// A small, purpose-built shape for skin/climate-based recommendation logic
// — not the raw Open-Meteo response. Temperature and humidity drive
// dry/humid/cold/hot classification; UV index drives sun-protection
// emphasis. See lib/backend/scan-service.ts's deriveClimateSignals for how
// this gets turned into recommendation-engine.ts scoring inputs.
export type ClimateSnapshot = {
  temperatureC: number
  humidityPercent: number
  uvIndex: number
}

type OpenMeteoCurrentResponse = {
  current?: {
    temperature_2m?: number
    relative_humidity_2m?: number
    uv_index?: number
  }
}

// Returns null on any failure (network, timeout, non-OK response,
// unexpected shape) rather than throwing — callers treat "no climate data"
// as a normal, expected outcome (climate-aware recommendations are always
// optional per AGENTS.md's non-negotiables), never an error to surface to
// the user or retry.
export async function getClimateSnapshot(
  latitude: number,
  longitude: number
): Promise<ClimateSnapshot | null> {
  const cacheKey = roundedCoordinateKey(latitude, longitude)
  const cached = climateCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot
  }

  const url = new URL(OPEN_METEO_FORECAST_ENDPOINT)
  url.searchParams.set("latitude", String(latitude))
  url.searchParams.set("longitude", String(longitude))
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,uv_index"
  )

  const abortController = new AbortController()
  const timeout = setTimeout(
    () => abortController.abort(),
    CLIMATE_FETCH_TIMEOUT_MS
  )

  try {
    const response = await fetch(url, { signal: abortController.signal })

    if (!response.ok) {
      console.info(
        `[Climate] Open-Meteo request failed with status ${response.status}`
      )
      return null
    }

    const payload = (await response.json()) as OpenMeteoCurrentResponse
    const current = payload.current

    if (
      typeof current?.temperature_2m !== "number" ||
      typeof current?.relative_humidity_2m !== "number" ||
      typeof current?.uv_index !== "number"
    ) {
      console.info("[Climate] Open-Meteo returned an unexpected response shape")
      return null
    }

    const snapshot: ClimateSnapshot = {
      temperatureC: current.temperature_2m,
      humidityPercent: current.relative_humidity_2m,
      uvIndex: current.uv_index,
    }
    climateCache.set(cacheKey, { snapshot, expiresAt: Date.now() + CLIMATE_CACHE_TTL_MS })
    return snapshot
  } catch (error) {
    console.info(
      "[Climate] Open-Meteo request failed",
      error instanceof Error ? error.message : error
    )
    return null
  } finally {
    clearTimeout(timeout)
  }
}
