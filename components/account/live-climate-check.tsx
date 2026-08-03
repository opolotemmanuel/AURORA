"use client"

// Optional, on-demand "what's the weather right now" check on the Climate
// settings tab — a standalone feature, not tied to any scan. This is its
// own explicit consent moment: the browser's Geolocation permission prompt
// only fires when the user clicks the button below, never automatically,
// and never reuses/assumes consent already granted during a scan (browsers
// scope geolocation permission per-origin, not per-flow, so a prior scan
// grant may still let getCurrentPosition resolve immediately here — but
// this component never skips asking; it always goes through the same
// requestLocation() call components/scan/ScanFlow.tsx uses).
//
// Result state (coords + climate) lives in this component's React state
// only, for this one page view — nothing here is ever sent anywhere but
// the getLiveClimateSnapshot server action, and that action never persists
// anything either (see app/(dashboard)/account/live-climate-action.ts).
import { useState } from "react"
import { IconDroplet, IconLoader2, IconMapPin, IconSunHigh, IconTemperature } from "@tabler/icons-react"

import { getLiveClimateSnapshot, type LiveClimateResult } from "@/app/(dashboard)/account/live-climate-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { COMFORT_BAND_BADGE_VARIANT } from "@/components/report/sections/climate-conditions"

// Mirrors components/scan/ScanFlow.tsx's LocationStatus exactly (see that
// file's comment on "unsupported" vs "denied") — kept as a separate type
// here rather than a shared import since the two flows are deliberately
// independent features, not two callers of one shared consent component.
type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported"

export function LiveClimateCheck() {
  const [status, setStatus] = useState<LocationStatus>("idle")
  const [isFetching, setIsFetching] = useState(false)
  const [climate, setClimate] = useState<LiveClimateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function requestLocation() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus("unsupported")
      return
    }

    setError(null)
    setClimate(null)
    setStatus("requesting")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("granted")
        setIsFetching(true)

        const result = await getLiveClimateSnapshot(position.coords.latitude, position.coords.longitude)

        setIsFetching(false)
        if (!result.success) {
          setError(result.error)
          return
        }

        setClimate(result.climate)
      },
      () => {
        setStatus("denied")
      },
      { timeout: 8000 },
    )
  }

  const isProblem = status === "denied" || status === "unsupported"
  const isBusy = status === "requesting" || isFetching

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Check current conditions</p>
          <p className="text-xs text-muted-foreground">
            See today&apos;s weather where you are right now — a fresh, one-time check, separate from your scan
            history. Never saved.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={requestLocation}>
          {isBusy ? <IconLoader2 className="size-4 animate-spin" /> : <IconMapPin className="size-4" />}
          {status === "requesting" ? "Requesting..." : isFetching ? "Checking..." : "Check current weather"}
        </Button>
      </div>

      {isProblem ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <IconMapPin className="size-4 shrink-0 text-primary" />
          {status === "denied"
            ? "Location wasn't shared, so there's nothing to check right now — the rest of this page is unaffected. You can try again anytime."
            : "This browser or connection doesn't support location access right now (needs a supported browser and a secure, HTTPS or localhost, connection)."}
        </p>
      ) : null}

      {error ? <p className="text-xs text-muted-foreground">{error}</p> : null}

      {climate ? (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Right now, at your current location:</p>
            <Badge variant={COMFORT_BAND_BADGE_VARIANT[climate.comfortBand]}>{climate.comfortBand} comfort</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <IconTemperature className="size-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground">{Math.round(climate.temperatureC)}°C</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <IconDroplet className="size-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground">{Math.round(climate.humidityPercent)}% humidity</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <IconSunHigh className="size-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground">UV index {Math.round(climate.uvIndex)}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {climate.interpretiveSentences.length > 0 ? (
              climate.interpretiveSentences.map((sentence) => <p key={sentence}>{sentence}</p>)
            ) : (
              <p>Conditions right now are mild — nothing notable to call out.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
