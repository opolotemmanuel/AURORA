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
  size?: number
}

const DEFAULT_CHART_SIZE = 280
const LABEL_PADDING = 26

export function DimensionRadarSvg({
  dimensions,
  size = DEFAULT_CHART_SIZE,
}: DimensionRadarSvgProps) {
  if (dimensions.length === 0) return null

  const geometry = buildDimensionChartGeometry(dimensions, size, 0.3)
  const { center, outerRadius, points, polygonPoints, gridRings } = geometry
  const count = points.length

  return (
    <View wrap={false} style={{ alignItems: "center", marginVertical: 8 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
          points={polygonPoints}
          fill={reportColors.chartFill}
          stroke={reportColors.chart}
          strokeWidth={1.5}
        />

        {points.map((point) => {
          const { x, y } = getAxisLabelPosition(
            point.angle,
            center,
            outerRadius,
            LABEL_PADDING,
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
