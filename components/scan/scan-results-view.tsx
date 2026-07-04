"use client"

import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import { SkinReportContent } from "@/components/scan/skin-report-content"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SkinAssessment } from "@/lib/scan/types"

type ScanResultsViewProps = {
  assessment: SkinAssessment
  imageSrc: string
  onNewScan: () => void
  onReEdit: () => void
  onViewReport: () => void
  saveError?: string | null
}

export function ScanResultsView({
  assessment,
  imageSrc,
  onNewScan,
  onReEdit,
  onViewReport,
  saveError,
}: ScanResultsViewProps) {
  return (
    <ScanReportLayout
      imageSrc={imageSrc}
      onRescan={onNewScan}
      onReEdit={onReEdit}
      onViewReport={onViewReport}
    >
      {saveError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}
      <SkinReportContent assessment={assessment} />
    </ScanReportLayout>
  )
}
