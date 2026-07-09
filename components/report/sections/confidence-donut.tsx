// Spec section 7. A true multi-slice donut would imply Face Detection/
// Lighting/Image Quality/Model Confidence sum to a whole, but they're four
// independent quality signals, not fractions of one total — so this uses a
// single progress-ring for the one real "overall" figure (dataviz-skill
// guidance: don't force part-of-whole encoding onto non-part-of-whole data)
// and a plain status list for the four contributing signals underneath.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { badgeVariantToColorVar } from "@/lib/reports/band-visuals"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ConfidenceDonut({ vm }: { vm: ReportViewModel }) {
  const { confidenceBreakdown } = vm
  const dashOffset = CIRCUMFERENCE * (1 - confidenceBreakdown.overallFillRatio)

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>AI Confidence Breakdown</CardTitle>
        <CardDescription>How confident Aura's AI is in this scan's conditions and reading.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Overall AI confidence ring">
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--color-muted)" strokeWidth="12" />
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="66" textAnchor="middle" className="fill-foreground text-xs font-medium">
            Overall Confidence
          </text>
          <text x="70" y="86" textAnchor="middle" className="fill-foreground text-lg font-semibold">
            {confidenceBreakdown.overallLabel}
          </text>
        </svg>

        <ul className="space-y-3">
          {confidenceBreakdown.items.map((item) => (
            <li key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
              <span className="text-foreground">{item.label}</span>
              <span className="text-muted-foreground">{item.visualLabel}</span>
              <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(item.fillRatio * 100)}%`,
                    backgroundColor: badgeVariantToColorVar(item.badgeVariant),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
