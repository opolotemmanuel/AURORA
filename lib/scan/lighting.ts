// Shared luminance bands for the real (non-cosmetic) lighting-quality gate —
// imported by both the client-side live camera check
// (components/scan/ScanFlow.tsx, sampling the video feed via canvas) and the
// server-side upload check (lib/backend/image-lighting.ts, decoding the
// final uploaded file via sharp), so the two can never drift apart. Pure
// math only, no browser or Node APIs, so it's safe in either bundle.
//
// Thresholds are a first-pass calibration (0-255 average luminance,
// 0.299R+0.587G+0.114B), not scientifically tuned — expect adjustment after
// real-world testing.
export type LightingBand = "too_dark" | "good" | "too_bright"

export const TOO_DARK_THRESHOLD = 60
export const TOO_BRIGHT_THRESHOLD = 200

export function classifyLuminance(averageLuminance: number): LightingBand {
  if (averageLuminance < TOO_DARK_THRESHOLD) return "too_dark"
  if (averageLuminance > TOO_BRIGHT_THRESHOLD) return "too_bright"
  return "good"
}
