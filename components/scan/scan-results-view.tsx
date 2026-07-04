"use client"

import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import { SkinReportContent } from "@/components/scan/skin-report-content"
import type { SkinAssessment } from "@/lib/scan/types"

type ScanResultsViewProps = {
  assessment: SkinAssessment
  imageSrc: string
  onNewScan: () => void
  onReEdit: () => void
  onViewReport: () => void
}

export function ScanResultsView({
  assessment,
  imageSrc,
  onNewScan,
  onReEdit,
  onViewReport,
}: ScanResultsViewProps) {
  return (
    <ScanReportLayout
      imageSrc={imageSrc}
      onRescan={onNewScan}
      onReEdit={onReEdit}
      onViewReport={onViewReport}
    >
      <SkinReportContent assessment={assessment} />
    </ScanReportLayout>
  )
}
