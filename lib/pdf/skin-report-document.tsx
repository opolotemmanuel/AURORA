import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import {
  formatBand,
  formatClimateBand,
  formatClimateZone,
  formatLocationLabel,
  formatSeasonBand,
  formatSkinHeadline,
} from "@/lib/scan/format"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
    color: "#555",
  },
  band: {
    fontSize: 12,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f0ebe6",
    alignSelf: "flex-start",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e0db",
  },
  rowLabel: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  rowNote: {
    fontSize: 10,
    color: "#555",
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f7f4f1",
    fontSize: 9,
    color: "#555",
  },
  meta: {
    fontSize: 9,
    color: "#888",
    marginTop: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  brandTagline: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  privacyNote: {
    fontSize: 9,
    color: "#666",
    marginBottom: 16,
  },
})

type SkinReportDocumentProps = {
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  userName: string
  scanDate: string
  logoSrc: string
}

export function SkinReportDocument({
  assessment,
  climateContext = null,
  userName,
  scanDate,
  logoSrc,
}: SkinReportDocumentProps) {
  return (
    <Document title="Aurora Organics Skin Report">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoSrc} style={styles.logo} />
          <View>
            <Text style={styles.brandName}>Aurora Organics</Text>
            <Text style={styles.brandTagline}>Skin Intelligence Report</Text>
            <Text style={styles.meta}>
              {scanDate} · Prepared for {userName}
            </Text>
          </View>
        </View>

        <Text style={styles.privacyNote}>
          This report contains cosmetic guidance only. No scan photo is stored or
          included in this document.
        </Text>

        <Text style={styles.title}>
          Your skin is {formatSkinHeadline(assessment.overallBand)}
        </Text>
        <Text style={styles.band}>
          Overall: {formatBand(assessment.overallBand)}
        </Text>
        <Text style={styles.subtitle}>{assessment.summary}</Text>

        {climateContext &&
        (climateContext.uvIndexBand ||
          climateContext.humidityBand ||
          climateContext.temperatureBand ||
          climateContext.city) ? (
          <>
            <Text style={styles.sectionTitle}>Local climate context</Text>
            {formatLocationLabel(climateContext) ? (
              <Text style={styles.rowNote}>
                {formatLocationLabel(climateContext)}
              </Text>
            ) : null}
            <Text style={styles.rowNote}>
              UV: {formatClimateBand(climateContext.uvIndexBand)} · Humidity:{" "}
              {formatClimateBand(climateContext.humidityBand)} · Temperature:{" "}
              {formatClimateBand(climateContext.temperatureBand)}
            </Text>
            <Text style={styles.rowNote}>
              Zone: {formatClimateZone(climateContext.climateZone)} · Season:{" "}
              {formatSeasonBand(climateContext.seasonBand)}
            </Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Dimensions</Text>
        {assessment.dimensions.map((dimension) => (
          <View key={dimension.id} style={styles.row}>
            <Text style={styles.rowLabel}>
              {dimension.label} — {formatBand(dimension.band)}
            </Text>
            <Text style={styles.rowNote}>{dimension.note}</Text>
          </View>
        ))}

        {assessment.naturalRecommendations.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Natural steps first</Text>
            {assessment.naturalRecommendations.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowLabel}>{item.title}</Text>
                <Text style={styles.rowNote}>{item.description}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Recommended Aurora products</Text>
        {assessment.recommendations.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowLabel}>{item.name}</Text>
            <Text style={styles.rowNote}>{item.reason}</Text>
          </View>
        ))}

        <Text style={styles.disclaimer}>{assessment.disclaimer}</Text>
      </Page>
    </Document>
  )
}
