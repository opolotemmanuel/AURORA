// Single source of truth for turning a coarse AI band into something a
// report can show. AGENTS.md's non-negotiable is "coarse, honest output
// only — bands, not invented numeric precision," so nothing here ever
// produces a literal percentage or score; `fillRatio` only sizes a bar/donut
// arc and is never rendered as text.
import type { CosmeticBand } from "@/lib/recommendations/types"
import type { ReportFinding } from "@/lib/backend/types"

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline"
export type PriorityTier = "low" | "medium" | "high"

type BandVisual = {
  /** Plain label for the band itself (e.g. an assessment table's "Status" column). */
  label: string
  /** "How good is this" framing, for score cards / metric tags. */
  wellnessLabel: string
  badgeVariant: BadgeVariant
  priority: PriorityTier
  /** 0-1, higher = better. Only ever used to size a bar/arc width. */
  fillRatio: number
}

// `low`/`balanced` both read as "nothing wrong" — the AI adapter uses `low`
// for concerns (little redness) and `balanced` for attributes framed as a
// balance (hydration, oil) — either way they're the good end of the scale.
const BAND_VISUALS: Record<CosmeticBand, BandVisual> = {
  low: { label: "Low", wellnessLabel: "Excellent", badgeVariant: "secondary", priority: "low", fillRatio: 0.92 },
  balanced: { label: "Balanced", wellnessLabel: "Excellent", badgeVariant: "secondary", priority: "low", fillRatio: 0.88 },
  mild: { label: "Mild", wellnessLabel: "Good", badgeVariant: "outline", priority: "low", fillRatio: 0.68 },
  moderate: { label: "Moderate", wellnessLabel: "Fair", badgeVariant: "default", priority: "medium", fillRatio: 0.45 },
  elevated: { label: "Elevated", wellnessLabel: "Needs attention", badgeVariant: "destructive", priority: "high", fillRatio: 0.22 },
  not_visible: { label: "Not assessed", wellnessLabel: "Not assessed", badgeVariant: "outline", priority: "low", fillRatio: 0 },
}

const BAND_SEVERITY_RANK: Record<CosmeticBand, number> = {
  not_visible: -1,
  low: 0,
  balanced: 0,
  mild: 1,
  moderate: 2,
  elevated: 3,
}

export function getBandVisual(band: string): BandVisual {
  return BAND_VISUALS[band as CosmeticBand] ?? BAND_VISUALS.not_visible
}

// Conservative by design: the overall tier reflects the single worst finding
// rather than an average, so one elevated concern can't be smoothed over by
// several good ones into a falsely reassuring "Excellent."
export function worstBandVisual(findings: Pick<ReportFinding, "band">[]): BandVisual {
  let worst: CosmeticBand = "not_visible"

  for (const finding of findings) {
    const band = (finding.band in BAND_SEVERITY_RANK ? finding.band : "not_visible") as CosmeticBand
    if (BAND_SEVERITY_RANK[band] > BAND_SEVERITY_RANK[worst]) worst = band
  }

  return BAND_VISUALS[worst]
}

type ConfidenceTier = "low" | "medium" | "high"

const CONFIDENCE_VISUALS: Record<ConfidenceTier, { label: string; badgeVariant: BadgeVariant; fillRatio: number }> = {
  low: { label: "Low confidence", badgeVariant: "destructive", fillRatio: 0.35 },
  medium: { label: "Medium confidence", badgeVariant: "default", fillRatio: 0.65 },
  high: { label: "High confidence", badgeVariant: "secondary", fillRatio: 0.92 },
}

export function getConfidenceVisual(confidence: string) {
  return CONFIDENCE_VISUALS[confidence as ConfidenceTier] ?? CONFIDENCE_VISUALS.low
}

export function getPriorityBadgeVariant(priority: PriorityTier): BadgeVariant {
  if (priority === "high") return "destructive"
  if (priority === "medium") return "default"
  return "secondary"
}

export function getPriorityLabel(priority: PriorityTier): string {
  if (priority === "high") return "High"
  if (priority === "medium") return "Medium"
  return "Low"
}

// Maps a badge variant to the same underlying theme token, for the rare
// spot (SVG fills) that can't use the Badge component itself but still must
// stay on semantic tokens rather than a hardcoded color.
export function badgeVariantToColorVar(variant: BadgeVariant): string {
  if (variant === "destructive") return "var(--color-destructive)"
  if (variant === "secondary") return "var(--color-primary)"
  if (variant === "default") return "var(--color-foreground)"
  return "var(--color-muted-foreground)"
}
