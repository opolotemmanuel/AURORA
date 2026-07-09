// Spec section 10. Hidden automatically when no prior scans exist — see
// report-sections.config.ts's isEnabled for this section, and
// report-view-model.ts's buildProgressTracking, which returns null in that
// case rather than this component deciding it itself.
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

const WIDTH = 480
const HEIGHT = 140
const PADDING = 24

export function ProgressTracking({ vm }: { vm: ReportViewModel }) {
  const tracking = vm.progressTracking
  if (!tracking) return null

  const { points, improved } = tracking
  const stepX = points.length > 1 ? (WIDTH - PADDING * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => ({
    x: PADDING + index * stepX,
    y: HEIGHT - PADDING - point.fillRatio * (HEIGHT - PADDING * 2),
  }))
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ")

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Progress Tracking</CardTitle>
          <CardDescription>How this scan compares to your previous ones.</CardDescription>
        </div>
        <Badge variant={improved ? "secondary" : "outline"} className="gap-1">
          {improved ? <IconTrendingUp className="size-3.5" /> : <IconTrendingDown className="size-3.5" />}
          {improved ? "Improved" : "Steady"}
        </Badge>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Skin score trend over time">
          <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="var(--color-border)" />
          <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
          {coords.map((c, index) => (
            <circle
              key={index}
              cx={c.x}
              cy={c.y}
              r={points[index].isCurrent ? 5 : 3.5}
              fill="var(--color-primary)"
            />
          ))}
        </svg>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {points.map((point, index) => (
            <span key={index} className={point.isCurrent ? "font-medium text-foreground" : undefined}>
              {point.dateLabel}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
