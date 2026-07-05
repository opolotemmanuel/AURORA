import { SkinReportDocument } from "@/components/reports/skin-report-document"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type SkinReportContentProps = {
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  className?: string
}

export function SkinReportContent({
  assessment,
  climateContext = null,
  className,
}: SkinReportContentProps) {
  return (
    <SkinReportDocument
      assessment={assessment}
      climateContext={climateContext}
      className={className}
    />
  )
}
