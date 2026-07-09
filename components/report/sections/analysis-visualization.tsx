// Spec section 4. Per the confirmed decision: no real facial landmark/
// segmentation data exists anywhere in this pipeline (the AI adapter only
// ever returns text findings + coarse bands), and the original photo isn't
// retained either (see cover-header.tsx). This renders an illustrative
// schematic face-zone diagram tinted by which findings were detected in
// each general region — clearly labeled as illustrative, not a real scan map.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { badgeVariantToColorVar } from "@/lib/reports/band-visuals"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

// Coarse concern -> face-zone mapping, only used to decide which schematic
// region gets tinted. Purely illustrative, not a real spatial detection.
const ZONE_BY_LABEL: Record<string, "forehead" | "cheeks" | "nose" | "chin"> = {
  "visible texture": "forehead",
  texture: "forehead",
  "hydration signs": "cheeks",
  hydration: "cheeks",
  "redness appearance": "cheeks",
  redness: "cheeks",
  pigmentation: "forehead",
  "tone unevenness": "forehead",
  radiance: "nose",
}

export function AnalysisVisualization({ vm }: { vm: ReportViewModel }) {
  const zoneTints = new Map<string, { fill: string; label: string }>()
  for (const row of vm.assessmentRows) {
    const zone = ZONE_BY_LABEL[row.area.toLowerCase()]
    if (zone && !zoneTints.has(zone)) {
      zoneTints.set(zone, { fill: badgeVariantToColorVar(row.statusBadgeVariant), label: row.area })
    }
  }

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>Analysis Visualization</CardTitle>
        <CardDescription>
          Illustrative zone summary based on AI findings — not a pixel-level scan map.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        <VisualPanel label="Original">
          <p className="max-w-[12rem] text-center text-xs text-muted-foreground">
            Original photo not retained per Aura's privacy policy.
          </p>
        </VisualPanel>

        <VisualPanel label="AI Overlay">
          <FaceZoneDiagram zoneTints={zoneTints} />
        </VisualPanel>

        <VisualPanel label="Analysis Map">
          <ul className="w-full space-y-2 text-sm">
            {Array.from(zoneTints.entries()).map(([zone, tint]) => (
              <li key={zone} className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tint.fill }} />
                <span className="capitalize text-muted-foreground">{zone}</span>
                <span className="text-foreground">— {tint.label}</span>
              </li>
            ))}
            {zoneTints.size === 0 ? (
              <li className="text-muted-foreground">No specific zones flagged in this scan.</li>
            ) : null}
          </ul>
        </VisualPanel>
      </CardContent>
    </Card>
  )
}

function VisualPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex aspect-3/4 items-center justify-center rounded-xl border border-border bg-muted p-4">
        {children}
      </div>
    </div>
  )
}

function FaceZoneDiagram({ zoneTints }: { zoneTints: Map<string, { fill: string; label: string }> }) {
  const zoneFill = (zone: string) => zoneTints.get(zone)?.fill ?? "var(--color-muted-foreground)"
  const zoneOpacity = (zone: string) => (zoneTints.has(zone) ? 0.45 : 0.12)

  return (
    <svg viewBox="0 0 100 130" className="h-full w-full" role="img" aria-label="Schematic face-zone diagram">
      <ellipse cx="50" cy="65" rx="38" ry="55" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M15 45 A38 55 0 0 1 85 45 L85 55 L15 55 Z" fill={zoneFill("forehead")} opacity={zoneOpacity("forehead")} />
      <path d="M14 60 L38 60 L38 100 L20 100 A55 38 0 0 1 14 60" fill={zoneFill("cheeks")} opacity={zoneOpacity("cheeks")} />
      <path d="M86 60 L62 60 L62 100 L80 100 A55 38 0 0 0 86 60" fill={zoneFill("cheeks")} opacity={zoneOpacity("cheeks")} />
      <ellipse cx="50" cy="75" rx="7" ry="16" fill={zoneFill("nose")} opacity={zoneOpacity("nose")} />
      <path d="M35 105 A15 15 0 0 0 65 105 L60 118 A20 12 0 0 1 40 118 Z" fill={zoneFill("chin")} opacity={zoneOpacity("chin")} />
    </svg>
  )
}
