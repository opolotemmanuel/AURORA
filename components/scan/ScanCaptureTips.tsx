"use client"

import { useState } from "react"

import {
  IconBulb,
  IconCrop,
  IconSun,
  IconUpload,
  IconUser,
  IconX,
} from "@tabler/icons-react"

import { IconTipCard } from "@/components/ui/icon-tip-card"

// Always-visible "Tips for better scans" panel — replaces the old hover-
// triggered "Tips for a clear scan" Tooltip in ScanFlow.tsx, which hid its
// (generic) content until a user found and hovered/focused a small text
// button. Adapted from wyasyn/review's components/scan/scan-camera-hints.tsx
// (git fetched and read in full, not typed from memory), with two
// corrections so every claim here stays true to THIS app's real
// implementation rather than review's:
//   - "Move closer" originally cited "40 to 60%" of frame height — that
//     number doesn't match our own gate. This app's real, exported
//     thresholds (lib/scan/quality/checks.ts's FACE_HEIGHT_MIN/MAX, the
//     same constants FacePositionOverlay draws its live guide oval from)
//     are 50-85%, so that's the number used below.
//   - The "On the crop step" tip described review's separate standalone
//     crop step, which doesn't exist in this app (Capture and Review were
//     already merged into one step — see ScanFlow.tsx's top comment).
//     Reworded to describe what actually happens here: the pan/zoom/
//     rotate/flip editor (ReviewStep) that appears in place after a photo
//     is captured or uploaded, still within the same "capture" step.
// Still not adopting review's dismiss-forever-via-localStorage behavior —
// the brief calls for an ALWAYS-VISIBLE panel, which a one-time persisted
// dismissal would contradict on repeat visits. The reference layout does
// show a close (X) affordance in the header row though, so this now has a
// real dismiss button that hides the panel for the current render only —
// plain useState, nothing written to storage — so a fresh page load (a new
// visit, or even just a manual refresh) always shows it again.
const TIPS = [
  {
    id: "distance",
    icon: IconUser,
    title: "Move closer",
    body: "Fill the guide oval — aim for your face taking up roughly 50 to 85% of the frame height.",
  },
  {
    id: "lighting",
    icon: IconSun,
    title: "Improve lighting",
    body: "Face a window or soft front light. Avoid strong backlight and harsh overhead glare.",
  },
  {
    id: "adjust",
    icon: IconCrop,
    title: "Adjust before continuing",
    body: "After you capture or upload, use the pan, zoom, and rotate controls to fill the frame with your face.",
  },
  {
    id: "upload",
    icon: IconUpload,
    title: "Try photo upload",
    body: "A phone photo (2 to 4MP+) often assesses better than a laptop webcam.",
  },
] as const

export function ScanCaptureTips() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <aside
      aria-label="Tips for better scans"
      className="grid content-start gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconBulb className="size-4" />
          Tips for better scans
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss tips"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconX className="size-4" />
        </button>
      </div>
      {TIPS.map((tip) => (
        <IconTipCard
          key={tip.id}
          icon={tip.icon}
          title={tip.title}
          description={tip.body}
        />
      ))}
    </aside>
  )
}
