import type { ReactNode } from "react"

import {
  Document,
  Image,
  Link,
  Page,
  Text,
  View,
} from "@react-pdf/renderer"

import { DimensionRadarSvg } from "@/lib/pdf/dimension-radar-svg"
import { reportStyles, sectionMinPresence } from "@/lib/pdf/report-styles"
import {
  formatApplicationSchedule,
  formatBand,
  formatClimateBand,
  formatClimateZone,
  formatLocationLabel,
  formatSeasonBand,
} from "@/lib/scan/format"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"

type ReportUsage = {
  modelId: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

type SkinReportDocumentProps = {
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  userName: string
  scanDate: string
  logoSrc: string
  captureMode?: string
  creditsCharged?: number | null
  usage?: ReportUsage | null
  productImageDataUris?: Map<string, string>
}

function ReportSection({
  title,
  first = false,
  keepTogether = false,
  minPresenceAhead,
  children,
}: {
  title: string
  first?: boolean
  keepTogether?: boolean
  minPresenceAhead?: number
  children: ReactNode
}) {
  return (
    <View
      wrap={keepTogether ? false : undefined}
      style={first ? reportStyles.sectionFirst : reportStyles.section}
    >
      <Text
        style={reportStyles.sectionTitle}
        minPresenceAhead={minPresenceAhead}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

export function SkinReportDocument({
  assessment,
  climateContext = null,
  userName,
  scanDate,
  logoSrc,
  captureMode,
  creditsCharged,
  usage,
  productImageDataUris,
}: SkinReportDocumentProps) {
  const metaLines = [
    scanDate,
    userName ? `Prepared for ${userName}` : null,
    captureMode ?? null,
  ].filter(Boolean) as string[]

  const tokenParts: string[] = []
  if (creditsCharged != null) {
    tokenParts.push(`${creditsCharged.toLocaleString()} credits`)
  }
  if (usage) {
    tokenParts.push(`${usage.totalTokens.toLocaleString()} tokens`)
    tokenParts.push(usage.modelId)
  }

  const locationLabel = climateContext
    ? formatLocationLabel(climateContext)
    : ""
  const hasClimateBands =
    climateContext?.uvIndexBand != null ||
    climateContext?.humidityBand != null ||
    climateContext?.temperatureBand != null

  return (
    <Document title="Aurora Organics Skin Report">
      <Page size="A4" style={reportStyles.page} wrap>
        <View style={reportStyles.header}>
          <View style={reportStyles.headerLeft}>
            <Image src={logoSrc} style={reportStyles.logo} />
            <View>
              <Text style={reportStyles.brandName}>Aurora Organics</Text>
              <Text style={reportStyles.brandTagline}>
                Skin Intelligence Report
              </Text>
            </View>
          </View>
          {metaLines.length > 0 ? (
            <View>
              {metaLines.map((line) => (
                <Text key={line} style={reportStyles.headerRight}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {tokenParts.length > 0 ? (
          <Text style={reportStyles.tokenStrip}>{tokenParts.join(" · ")}</Text>
        ) : null}

        <Text style={[reportStyles.meta, { marginBottom: 12 }]}>
          Cosmetic guidance only. No scan photo is stored or included.
        </Text>

        <ReportSection
          title="Overall assessment"
          first
          keepTogether
          minPresenceAhead={sectionMinPresence.compact}
        >
          <Text style={reportStyles.bodyStrong}>
            {formatBand(assessment.overallBand)}
          </Text>
          <Text style={[reportStyles.body, { marginTop: 6 }]}>
            {assessment.summary}
          </Text>
        </ReportSection>

        <ReportSection
          title="Local climate context"
          keepTogether
          minPresenceAhead={sectionMinPresence.standard}
        >
          {!climateContext || (!locationLabel && !hasClimateBands) ? (
            <Text style={reportStyles.body}>
              Climate data was not available for this scan.
            </Text>
          ) : (
            <View>
              {locationLabel ? (
                <Text style={[reportStyles.bodyStrong, { marginBottom: 6 }]}>
                  {locationLabel}
                </Text>
              ) : null}
              {hasClimateBands ? (
                <View style={reportStyles.climateGrid}>
                  <View style={reportStyles.climateCell}>
                    <Text style={reportStyles.climateLabel}>UV exposure</Text>
                    <Text style={reportStyles.climateValue}>
                      {formatClimateBand(climateContext.uvIndexBand)}
                    </Text>
                  </View>
                  <View style={reportStyles.climateCell}>
                    <Text style={reportStyles.climateLabel}>Humidity</Text>
                    <Text style={reportStyles.climateValue}>
                      {formatClimateBand(climateContext.humidityBand)}
                    </Text>
                  </View>
                  <View style={reportStyles.climateCell}>
                    <Text style={reportStyles.climateLabel}>Temperature</Text>
                    <Text style={reportStyles.climateValue}>
                      {formatClimateBand(climateContext.temperatureBand)}
                    </Text>
                  </View>
                  <View style={reportStyles.climateCell}>
                    <Text style={reportStyles.climateLabel}>Climate zone</Text>
                    <Text style={reportStyles.climateValue}>
                      {formatClimateZone(climateContext.climateZone)}
                    </Text>
                  </View>
                </View>
              ) : null}
              {climateContext.seasonBand ? (
                <Text style={[reportStyles.meta, { marginTop: 6 }]}>
                  Season: {formatSeasonBand(climateContext.seasonBand)}
                </Text>
              ) : null}
            </View>
          )}
        </ReportSection>

        <ReportSection
          title="Dimensions"
          keepTogether
          minPresenceAhead={sectionMinPresence.dimensions}
        >
          <View wrap={false}>
            <Text style={reportStyles.chartCaption}>
              Band levels from minimal (center) to elevated (outer edge)
            </Text>
            <DimensionRadarSvg dimensions={assessment.dimensions} />
          </View>
          <View style={reportStyles.twoColumnGrid}>
            {assessment.dimensions.map((dimension) => (
              <View key={dimension.id} wrap={false} style={reportStyles.gridCell}>
                <View style={reportStyles.gridCellHeader}>
                  <Text style={reportStyles.rowLabel}>{dimension.label}</Text>
                  <Text style={reportStyles.rowValue}>
                    {formatBand(dimension.band)}
                  </Text>
                </View>
                {dimension.note ? (
                  <Text style={reportStyles.rowNote}>{dimension.note}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </ReportSection>

        {assessment.naturalRecommendations.length > 0 ? (
          <ReportSection
            title="Natural steps first"
            keepTogether
            minPresenceAhead={sectionMinPresence.standard}
          >
            <Text style={[reportStyles.body, { marginBottom: 8 }]}>
              Everyday habits and gentle natural routines to try before
              formulated products.
            </Text>
            {assessment.naturalRecommendations.map((item) => {
              const scheduleLabel = formatApplicationSchedule(
                item.applicationTime,
                item.applicationFrequency,
              )

              return (
              <View key={item.id} wrap={false} style={reportStyles.bulletRow}>
                <View style={reportStyles.bullet} />
                <View style={{ flex: 1 }}>
                  <Text style={reportStyles.rowLabel}>{item.title}</Text>
                  {scheduleLabel ? (
                    <Text style={[reportStyles.meta, { marginBottom: 2 }]}>
                      {scheduleLabel}
                    </Text>
                  ) : null}
                  <Text style={reportStyles.rowNote}>{item.description}</Text>
                </View>
              </View>
              )
            })}
          </ReportSection>
        ) : null}

        <ReportSection
          title="Recommended Aurora products"
          minPresenceAhead={sectionMinPresence.products}
        >
          <View style={reportStyles.twoColumnGrid}>
            {assessment.recommendations.map((item) => {
              const imageSrc = item.imageUrl?.trim()
                ? productImageDataUris?.get(item.imageUrl)
                : null
              const scheduleLabel = formatApplicationSchedule(
                item.applicationTime,
                item.applicationFrequency,
              )

              return (
                <View key={item.id} wrap={false} style={reportStyles.productCell}>
                  {imageSrc ? (
                    <Image src={imageSrc} style={reportStyles.productImage} />
                  ) : null}
                  <View style={reportStyles.productBody}>
                    <Text style={reportStyles.rowLabel}>{item.name}</Text>
                    {scheduleLabel ? (
                      <Text style={[reportStyles.meta, { marginBottom: 2 }]}>
                        {scheduleLabel}
                      </Text>
                    ) : null}
                    <Text style={reportStyles.rowNote}>{item.reason}</Text>
                    {item.storeUrl ? (
                      <Link src={item.storeUrl} style={reportStyles.productLink}>
                        View on Aurora Organics
                      </Link>
                    ) : null}
                  </View>
                </View>
              )
            })}
          </View>
        </ReportSection>

        <Text wrap={false} style={reportStyles.disclaimer}>
          {assessment.disclaimer}
        </Text>

        <View style={reportStyles.pageFooter} fixed>
          <Text style={reportStyles.pageFooterText}>
            Aurora Organics · Skin Intelligence Report
          </Text>
          <Text
            style={reportStyles.pageFooterText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
