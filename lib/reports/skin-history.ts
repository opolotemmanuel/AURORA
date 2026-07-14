// Aggregates a user's own past ReportFinding rows (already persisted per
// scan — no new AI calls, no schema changes) into per-concern trend series
// for the Skin History view (app/(dashboard)/skin-history/page.tsx). Reuses
// FINDING_CONCERN_MAP rather than a second label->concern mapping, same
// reasoning as lib/reports/report-view-model.ts's buildMetrics.
import { FINDING_CONCERN_MAP } from "@/lib/backend/scan-service"
import type { StoredReport } from "@/lib/backend/types"
import type { CosmeticBand, SkinConcern } from "@/lib/recommendations/types"
import { getBandVisual } from "@/lib/reports/band-visuals"

// The AI adapter's prompt (lib/ai/gemini-adapter.ts's buildCosmeticPrompt)
// only ever asks for these 5 concerns — the other SkinConcern union members
// (oilBalance, barrierComfort, daytimeProtection) have no finding label that
// maps to them today, so a trend chart for them would always be empty. This
// list is the fixed vocabulary the trend view is built around, per the spec.
export const TRACKED_CONCERNS: Array<{ concern: SkinConcern; label: string }> = [
  { concern: "texture", label: "Texture" },
  { concern: "hydration", label: "Hydration" },
  { concern: "rednessAppearance", label: "Redness" },
  { concern: "pigmentationAppearance", label: "Pigmentation" },
  { concern: "radiance", label: "Radiance" },
]

// Ordinal scale for plotting a coarse band on a chart axis. This mapping is
// an interpretive choice made for this feature only — it is not something
// the AI returns or asserts.
//
// `not_visible` is deliberately excluded (mapped to `undefined`, not 0): it
// means "no reading for this concern in this scan," not "zero severity," so
// it must never become a data point on the line.
//
// `low` and `balanced` share rank 1 rather than getting separate ranks. Per
// band-visuals.ts's BAND_SEVERITY_RANK (the app's existing authority on band
// ordering), both sit at the same "good end" — the AI adapter uses `low` for
// concern-framed labels (little redness) and `balanced` for balance-framed
// labels (hydration, radiance) for the same severity, never both for one
// concern. Treating them as different ranks would invent a distinction the
// AI's own vocabulary doesn't make.
export const BAND_SCALE: Partial<Record<CosmeticBand, number>> = {
  low: 1,
  balanced: 1,
  mild: 2,
  moderate: 3,
  elevated: 4,
}

export type ConcernTrendPoint = {
  date: string
  value: number
  band: CosmeticBand
  bandLabel: string
}

export type ConcernTrend = {
  concern: SkinConcern
  label: string
  points: ConcernTrendPoint[]
}

// `reports` is expected newest-first (listReportsForUser's default order) —
// flipped to chronological here so every trend's points read oldest -> newest.
export function buildSkinHistory(reports: StoredReport[]): ConcernTrend[] {
  const chronological = [...reports].reverse()

  return TRACKED_CONCERNS.map(({ concern, label }) => {
    const points: ConcernTrendPoint[] = []

    for (const report of chronological) {
      const finding = report.analysis.cosmeticFindings.find(
        (f) => FINDING_CONCERN_MAP[f.label.toLowerCase()] === concern
      )
      if (!finding) continue

      const band = finding.band as CosmeticBand
      const value = BAND_SCALE[band]
      if (value === undefined) continue // not_visible, or a band outside the known scale

      points.push({ date: report.createdAt, value, band, bandLabel: getBandVisual(band).label })
    }

    return { concern, label, points }
  })
}
