import type { CaptureMode } from "@/lib/scan/types"

export const LIVE_SESSION_PRIVACY_LINE =
  "Video stays on your device until you finish — only your saved report is stored."

export const CAPTURE_COPY: Record<
  CaptureMode,
  { title: string; description: string }
> = {
  upload: {
    title: "Upload your photo",
    description: "Choose a clear, well-lit photo of your face",
  },
  camera: {
    title: "Take a photo",
    description: "Position your face in the frame; we'll check lighting live",
  },
  live: {
    title: "Live scan",
    description: "Real-time guidance with Aurora Pro",
  },
}
