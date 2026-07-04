"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { bandToScore } from "@/lib/scan/band-score"
import { formatBand } from "@/lib/scan/format"
import type { AssessmentBand, SkinDimension } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type DimensionRadarChartProps = {
  dimensions: SkinDimension[]
  className?: string
}

const config = {
  score: { label: "Band level", color: "var(--chart-1)" },
} satisfies ChartConfig

export function DimensionRadarChart({
  dimensions,
  className,
}: DimensionRadarChartProps) {
  const data = dimensions.map((dimension) => ({
    axis: dimension.label,
    score: bandToScore(dimension.band),
    band: dimension.band,
  }))

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-56 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground",
          className,
        )}
      >
        No dimension data for this scan
      </div>
    )
  }

  return (
    <ChartContainer
      config={config}
      className={cn("mx-auto aspect-square h-56 w-full max-w-sm", className)}
    >
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis
          dataKey="axis"
          tickLine={false}
          className="text-[10px] fill-muted-foreground"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const band = (item.payload as { band?: AssessmentBand }).band
                return band
                  ? `${formatBand(band)} (${value}/4)`
                  : String(value)
              }}
            />
          }
        />
        <Radar
          name="score"
          dataKey="score"
          stroke="var(--color-score)"
          fill="var(--color-score)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  )
}
