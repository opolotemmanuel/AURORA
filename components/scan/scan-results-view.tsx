"use client"

import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import { SkinReportContent } from "@/components/scan/skin-report-content"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"

type ScanResultsViewProps = {
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  imageSrc: string
  onNewScan: () => void
  onReEdit: () => void
  onViewReport: () => void
  creditsCharged?: number | null
}

export function ScanResultsView({
  assessment,
  climateContext = null,
  imageSrc,
  onNewScan,
  onReEdit,
  onViewReport,
  creditsCharged,
}: ScanResultsViewProps) {
  return (
    <ScanReportLayout
      imageSrc={imageSrc}
      onRescan={onNewScan}
      onReEdit={onReEdit}
      onViewReport={onViewReport}
    >
      <Alert className="mb-4">
        <AlertDescription>
          Your photo is shown only for this session. It is not stored or included
          in saved reports or PDFs.
          {creditsCharged != null
            ? ` This scan used ${creditsCharged.toLocaleString()} credits.`
            : null}
        </AlertDescription>
      </Alert>
      <SkinReportContent
        assessment={assessment}
        climateContext={climateContext}
      />
    </ScanReportLayout>
  )
}
