// One concern's line chart, same hand-rolled inline-SVG approach as
// components/report/sections/progress-tracking.tsx (no charting library
// installed in this app — see package.json). Deliberately does not render a
// numeric y-axis: AGENTS.md's "coarse, honest output only" rule applies to
// this derived chart too, so the only labels are the band words themselves
// (Low, Mild, Moderate, ...), never a plotted number.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ConcernTrend } from "@/lib/reports/skin-history"
import { BAND_SCALE, MIN_TREND_POINTS } from "@/lib/reports/skin-history"

import { ConcernTrendEmptyState } from "./concern-trend-empty-state"

const WIDTH = 400
const HEIGHT = 140
const PADDING_X = 36
const PADDING_Y = 20

const MIN_VALUE = 1
const MAX_VALUE = Math.max(...Object.values(BAND_SCALE).filter((v): v is number => v !== undefined))

export function ConcernTrendChart({ trend }: { trend: ConcernTrend }) {
  const { label, points } = trend

  if (points.length < MIN_TREND_POINTS) {
    return <ConcernTrendEmptyState label={label} pointsCount={points.length} />
  }

  const range = MAX_VALUE - MIN_VALUE || 1
  const stepX = (WIDTH - PADDING_X * 2) / (points.length - 1)
  const coords = points.map((point, index) => ({
    x: PADDING_X + index * stepX,
    y: HEIGHT - PADDING_Y - ((point.value - MIN_VALUE) / range) * (HEIGHT - PADDING_Y * 2),
  }))
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>How this reading has changed across your scans</CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${label} trend across your scans: ${points.map((p) => p.bandLabel).join(", ")}`}
        >
          <line
            x1={PADDING_X}
            y1={HEIGHT - PADDING_Y}
            x2={WIDTH - PADDING_X}
            y2={HEIGHT - PADDING_Y}
            stroke="var(--color-border)"
          />
          <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
          {coords.map((c, index) => (
            <g key={index}>
              <circle cx={c.x} cy={c.y} r={3.5} fill="var(--color-primary)" />
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor={index === 0 ? "start" : index === coords.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground"
                fontSize="9"
              >
                {points[index].bandLabel}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {points.map((point, index) => (
            <span key={index}>{formatDate(point.date)}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short" })
}
