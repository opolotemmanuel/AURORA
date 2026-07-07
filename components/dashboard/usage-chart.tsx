"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const CHART_MARGIN = { top: 8, right: 8, left: 12, bottom: 0 }

const yAxisProps = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  width: 48,
  className: "text-xs fill-muted-foreground",
} as const

export function UsageBarChart({
  data,
  label = "Tokens",
}: {
  data: { label: string; value: number }[]
  label?: string
}) {
  const config = {
    value: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig

  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-none border border-dashed border-border text-sm text-muted-foreground">
        No usage data yet
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="h-48 w-full min-w-0">
      <BarChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs fill-muted-foreground"
        />
        <YAxis {...yAxisProps} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export function RoleDistributionChart({
  data,
}: {
  data: { role: string; count: number }[]
}) {
  const config = {
    count: { label: "Users", color: "var(--chart-2)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="h-48 w-full min-w-0">
      <BarChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="role"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs fill-muted-foreground"
        />
        <YAxis {...yAxisProps} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
