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
// (git fetched and read in full, not typed from memory).
//
// The "Move closer" and "On the crop step" tips below are review's exact
// original wording, verbatim — a deliberate, confirmed reversal of an
// earlier accuracy-based adaptation that had reworded them to match this
// app's real 50-85% face-height gate (lib/scan/quality/checks.ts's
// FACE_HEIGHT_MIN/MAX) and its merged capture+review step (no standalone
// crop step exists here — see ScanFlow.tsx's top comment). That earlier
// version was more accurate to this app's actual implementation; shipping
// review's original text instead is an intentional product decision, not
// an oversight to fix back.
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
    body: "Fill the oval. Your face should cover 40 to 60% of the frame height.",
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
    title: "On the crop step",
    body: "Expand the crop box so your face fills most of it, not the background.",
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
      className="grid content-start gap-2"
    >
      {/* Header row card: same scan-surface treatment as the tip cards
          below, matching review's scan-camera-hints.tsx exactly (icon
          badge, not an uppercase eyebrow label). */}
      <div className="scan-surface flex items-center justify-between gap-2 rounded-2xl border border-border/70 px-3 py-2 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
            <IconBulb className="size-3.5" aria-hidden />
          </span>
          <p className="truncate text-xs font-semibold text-foreground">Tips for better scans</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss tips"
          className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconX className="size-3.5" />
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
