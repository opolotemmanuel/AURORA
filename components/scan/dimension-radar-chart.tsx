"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
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

const MAX_BAND_SCORE = 4

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
      className={cn("mx-auto aspect-square max-h-[250px] w-full", className)}
    >
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const band = (item.payload as { band?: AssessmentBand }).band
                return band
                  ? `${formatBand(band)} (${value}/${MAX_BAND_SCORE})`
                  : String(value)
              }}
            />
          }
        />
        <PolarGrid />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis
          domain={[0, MAX_BAND_SCORE]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="score"
          dataKey="score"
          fill="var(--color-score)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
            fill: "var(--color-score)",
          }}
        />
      </RadarChart>
    </ChartContainer>
  )
}
