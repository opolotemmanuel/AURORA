// Hand-rolled inline-SVG bar chart — same no-library approach as
// components/report/sections/progress-tracking.tsx and
// components/profile/skin-history/concern-trend-chart.tsx (no charting
// package installed in this app, see package.json). Bars instead of a
// line/dot path since this plots daily counts (a magnitude per day), not a
// single trend across a handful of scans.
export type DailyCount = { date: string; count: number }

const WIDTH = 480
const HEIGHT = 160
const PADDING_X = 4
const PADDING_TOP = 8
const PADDING_BOTTOM = 22
const BAR_GAP = 3

export function BarTrendChart({ points, emptyLabel }: { points: DailyCount[]; emptyLabel: string }) {
  const hasData = points.some((point) => point.count > 0)

  if (!hasData) {
    return (
      <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{emptyLabel}</p>
    )
  }

  const maxValue = Math.max(1, ...points.map((point) => point.count))
  const plotWidth = WIDTH - PADDING_X * 2
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const slotWidth = plotWidth / points.length
  const barWidth = Math.max(1, slotWidth - BAR_GAP)
  const baselineY = HEIGHT - PADDING_BOTTOM

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Daily counts: ${points.map((point) => `${point.date}: ${point.count}`).join(", ")}`}
      >
        <line x1={PADDING_X} y1={baselineY} x2={WIDTH - PADDING_X} y2={baselineY} stroke="var(--color-border)" />
        {points.map((point, index) => {
          const barHeight = (point.count / maxValue) * plotHeight
          const x = PADDING_X + index * slotWidth + BAR_GAP / 2
          const y = baselineY - barHeight
          return (
            <rect
              key={point.date}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              fill="var(--color-primary)"
            />
          )
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatShortDate(points[0].date)}</span>
        <span>{formatShortDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  )
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
}
