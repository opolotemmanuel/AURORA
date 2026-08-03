// Tooltip copy for the capture header's tab control — pulled verbatim from
// wyasyn/review's lib/scan/capture-copy.ts (CAPTURE_TAB_TOOLTIPS only;
// review's CAPTURE_COPY/LIVE_SESSION_PRIVACY_LINE/"live" tooltip aren't
// included here since this app has no live-scan tab/mode to attach them to
// — adding those would be a new feature, not a presentation-layer copy).
export const CAPTURE_TAB_TOOLTIPS = {
  upload: "Upload a clear face photo for a personalized skin report",
  camera: "Use your camera with live lighting guidance for a scan",
  advice: "Chat about routines, products, and skin concerns",
  dashboard: "Open your dashboard for reports, usage, and account settings",
} as const
