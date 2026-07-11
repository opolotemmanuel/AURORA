// One adapter for the Open-Meteo weather API (open-meteo.com) — same
// "one adapter per external service" pattern as lib/ai/gemini-adapter.ts and
// lib/email/adapter.ts. Open-Meteo's free forecast endpoint needs no API
// key/auth, so this is plain fetch(), no SDK. Entirely independent of the
// Gemini adapter — this never touches the app's Gemini API quota.
const OPEN_METEO_FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
const CLIMATE_FETCH_TIMEOUT_MS = 5000

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

    return {
      temperatureC: current.temperature_2m,
      humidityPercent: current.relative_humidity_2m,
      uvIndex: current.uv_index,
    }
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
