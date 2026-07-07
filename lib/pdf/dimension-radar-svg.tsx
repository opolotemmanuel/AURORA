import { Line, Polygon, Svg, Text, View } from "@react-pdf/renderer"

import {
  buildDimensionChartGeometry,
  getAxisLabelDominantBaseline,
  getAxisLabelPosition,
  getAxisLabelTextAnchor,
} from "@/lib/scan/dimension-chart-geometry"
import type { SkinDimension } from "@/lib/scan/types"

import { reportColors } from "./report-styles"

type DimensionRadarSvgProps = {
  dimensions: SkinDimension[]
}

/** Inner chart diameter — labels sit in the padded margin outside this. */
const CHART_SIZE = 190
const LABEL_PADDING = 52
const SVG_SIZE = CHART_SIZE + LABEL_PADDING * 2

export function DimensionRadarSvg({ dimensions }: DimensionRadarSvgProps) {
  if (dimensions.length === 0) return null

  const geometry = buildDimensionChartGeometry(dimensions, CHART_SIZE, 0.26)
  const { outerRadius, points, gridRings } = geometry
  const offset = LABEL_PADDING
  const center = geometry.center + offset
  const count = points.length

  const offsetPolygon = points
    .map((point) => `${point.x + offset},${point.y + offset}`)
    .join(" ")

  return (
    <View wrap={false} style={{ alignItems: "center", marginVertical: 4 }}>
      <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
        {gridRings.map((ringRadius) => {
          const ringPoints = Array.from({ length: count }, (_, index) => {
            const angle = (Math.PI * 2 * index) / count - Math.PI / 2
            const x = center + ringRadius * Math.cos(angle)
            const y = center + ringRadius * Math.sin(angle)
            return `${x},${y}`
          }).join(" ")

          return (
            <Polygon
              key={ringRadius}
              points={ringPoints}
              fill="none"
              stroke={reportColors.border}
              strokeWidth={0.5}
            />
          )
        })}

        {points.map((point) => (
          <Line
            key={point.label}
            x1={center}
            y1={center}
            x2={center + outerRadius * Math.cos(point.angle)}
            y2={center + outerRadius * Math.sin(point.angle)}
            stroke={reportColors.border}
            strokeWidth={0.5}
          />
        ))}

        <Polygon
          points={offsetPolygon}
          fill={reportColors.chartFill}
          stroke={reportColors.chart}
          strokeWidth={1.5}
        />

        {points.map((point) => {
          const { x, y } = getAxisLabelPosition(
            point.angle,
            center,
            outerRadius,
            LABEL_PADDING - 8,
          )

          return (
            <Text
              key={`axis-${point.label}`}
              x={x}
              y={y}
              textAnchor={getAxisLabelTextAnchor(point.angle)}
              dominantBaseline={getAxisLabelDominantBaseline(point.angle)}
              fill={reportColors.muted}
              style={{ fontSize: 7, fontFamily: "Inter" }}
            >
              {point.label}
            </Text>
          )
        })}
      </Svg>
    </View>
  )
}
