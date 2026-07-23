"use client"

// Real per-user scan activity over the last 14 days — the one place in this
// app recharts is used (see AGENTS.md: everywhere else stays hand-rolled
// inline SVG, e.g. components/admin/analytics/bar-trend-chart.tsx and the
// standalone Skin History page's trend charts — this component is
// deliberately scoped to the main dashboard only, not a replacement for
// those). Data comes from lib/backend/report-store.ts's
// getScanCountsByDayForUser, zero-filled per day server-side before this
// ever renders — never a fabricated/interpolated point.
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type DailyScanCount = { date: string; count: number }

const chartConfig = {
  count: { label: "Scans", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ScanUsageChart({ data }: { data: DailyScanCount[] }) {
  const hasActivity = data.some((point) => point.count > 0)

  if (!hasActivity) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No scans in the last 14 days.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full min-w-0">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => value.slice(5)}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={28}
          allowDecimals={false}
          className="text-xs fill-muted-foreground"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
