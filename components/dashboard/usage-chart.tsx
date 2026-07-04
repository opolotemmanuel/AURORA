"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

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
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No usage data yet
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="h-48 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          className="text-xs fill-muted-foreground"
        />
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
    <ChartContainer config={config} className="h-48 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="role"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={32}
          className="text-xs fill-muted-foreground"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
