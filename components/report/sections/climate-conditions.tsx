// New section: local weather conditions at scan time, an interpretive read
// on what they mean for skin comfort, and the Skin Comfort Score band. Only
// rendered when vm.climate is present (see report-sections.config.ts's
// isEnabled) — older reports predating this feature, and scans where the
// weather fetch failed, simply don't show this section, no broken/empty
// state. The Comfort Score's raw 0-100 number is an internal computation
// detail (see lib/reports/comfort-score.ts) — only the band is shown here,
// same "coarse, honest output only, never invented numeric precision"
// convention every other score in this report follows (compare
// RecommendedProducts' matchStrength tier vs. its raw `score` field).
import { IconDroplet, IconSunHigh, IconTemperature } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BadgeVariant } from "@/lib/reports/band-visuals"
import type { ComfortBand } from "@/lib/reports/comfort-score"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

// Exported so components/account/live-climate-check.tsx's standalone live
// weather check (Settings > Climate tab) can render the same Comfort Score
// badge styling instead of a second, drifting copy of this mapping.
export const COMFORT_BAND_BADGE_VARIANT: Record<ComfortBand, BadgeVariant> = {
  Excellent: "secondary",
  Good: "outline",
  Moderate: "default",
  Poor: "destructive",
}

export function ClimateConditions({ vm }: { vm: ReportViewModel }) {
  const { climate } = vm
  if (!climate) return null

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Climate Conditions</CardTitle>
          <CardDescription>
            Local weather at scan time and what it can mean for how your skin feels — a general wellness read, not a
            clinical measure.
          </CardDescription>
        </div>
        <Badge variant={COMFORT_BAND_BADGE_VARIANT[climate.comfortBand]}>{climate.comfortBand} comfort</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <IconTemperature className="size-4 shrink-0 text-primary" />
            <span className="font-medium text-foreground">{Math.round(climate.temperatureC)}°C</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <IconDroplet className="size-4 shrink-0 text-primary" />
            <span className="font-medium text-foreground">{Math.round(climate.humidityPercent)}% humidity</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <IconSunHigh className="size-4 shrink-0 text-primary" />
            <span className="font-medium text-foreground">UV index {Math.round(climate.uvIndex)}</span>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {climate.interpretiveSentences.length > 0 ? (
            climate.interpretiveSentences.map((sentence) => <p key={sentence}>{sentence}</p>)
          ) : (
            <p>Conditions today are mild — no notable climate impact on your routine.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
