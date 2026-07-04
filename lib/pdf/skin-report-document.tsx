import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { formatBand, formatSkinHeadline } from "@/lib/scan/format"
import type { SkinAssessment } from "@/lib/scan/types"

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
    marginBottom: 20,
  },
  privacyNote: {
    fontSize: 9,
    color: "#666",
    marginBottom: 16,
  },
})

type SkinReportDocumentProps = {
  assessment: SkinAssessment
  userName: string
  scanDate: string
}

export function SkinReportDocument({
  assessment,
  userName,
  scanDate,
}: SkinReportDocumentProps) {
  return (
    <Document title="Aura Skin Report">
      <Page size="A4" style={styles.page}>
        <Text style={styles.meta}>
          Aura · {scanDate} · Prepared for {userName}
        </Text>

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

        <Text style={styles.sectionTitle}>Dimensions</Text>
        {assessment.dimensions.map((dimension) => (
          <View key={dimension.id} style={styles.row}>
            <Text style={styles.rowLabel}>
              {dimension.label} — {formatBand(dimension.band)}
            </Text>
            <Text style={styles.rowNote}>{dimension.note}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Aurora recommendations</Text>
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
