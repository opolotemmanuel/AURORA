// Shared browser-geolocation wrapper — same secure-context check, same
// unsupported/denied distinction, and same 8s timeout the scan flow's own
// location gate already used (components/scan/ScanFlow.tsx), just promise-
// based so both real call sites (the one-time grant at
// app/(onboarding)/onboarding/consent, and the scan page's silent per-visit
// re-check) share one implementation instead of two copies that could
// drift apart.
//
// Coordinates returned here are never written to localStorage/cookies/the
// database by either caller — they only ever flow into the one
// /api/scan/analyze request that uses them (see
// lib/backend/scan-service.ts's createScanReport), same privacy-by-design
// rule as before this file existed.
export type GeolocationResult =
  | { status: "granted"; lat: number; lon: number }
  | { status: "denied" }
  | { status: "unsupported" }

const GEOLOCATION_TIMEOUT_MS = 8000

export function requestGeolocation(): Promise<GeolocationResult> {
  if (typeof window === "undefined" || !window.isSecureContext || !navigator.geolocation) {
    return Promise.resolve({ status: "unsupported" })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ status: "granted", lat: position.coords.latitude, lon: position.coords.longitude })
      },
      () => resolve({ status: "denied" }),
      { timeout: GEOLOCATION_TIMEOUT_MS },
    )
  })
}
