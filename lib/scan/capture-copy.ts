import type { CaptureMode } from "@/lib/scan/types"

export const LIVE_SESSION_PRIVACY_LINE =
  "Video stays on your device until you finish — only your saved report is stored."

export const CAPTURE_COPY: Record<
  CaptureMode,
  { title: string; description: string }
> = {
  upload: {
    title: "Scan your skin",
    description: "Clear photo → personalized guidance & product picks",
  },
  camera: {
    title: "Scan your skin",
    description: "Live lighting check, then your skin report",
  },
  live: {
    title: "Live skin scan",
    description: "Real-time Pro guidance",
  },
  advice: {
    title: "Skin advice",
    description: "Ask about routines, concerns & recommendations",
  },
}
