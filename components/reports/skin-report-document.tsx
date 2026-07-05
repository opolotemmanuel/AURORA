import { DimensionRadarChart } from "@/components/scan/dimension-radar-chart"
import { ReportApplicationSchedule } from "@/components/reports/report-application-schedule"
import { ReportClimateBlock } from "@/components/reports/report-climate-block"
import { ReportDimensionTable } from "@/components/reports/report-dimension-table"
import { ReportProductList } from "@/components/reports/report-product-list"
import { ReportSection } from "@/components/reports/report-section"
import { formatBand } from "@/lib/scan/format"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type SkinReportDocumentProps = {
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  className?: string
}

export function SkinReportDocument({
  assessment,
  climateContext = null,
  className,
}: SkinReportDocumentProps) {
  return (
    <div className={cn("space-y-8 font-sans", className)}>
      <ReportSection title="Overall assessment" first>
        <p className="text-sm font-medium text-foreground">
          {formatBand(assessment.overallBand)}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {assessment.summary}
        </p>
      </ReportSection>

      <ReportSection title="Local climate context">
        <ReportClimateBlock climateContext={climateContext} />
      </ReportSection>

      <ReportSection title="Dimensions">
        <p className="mb-3 text-xs text-muted-foreground">
          Band levels from minimal (center) to elevated (outer edge)
        </p>
        <DimensionRadarChart
          dimensions={assessment.dimensions}
          variant="document"
        />
        <div className="mt-4">
          <ReportDimensionTable dimensions={assessment.dimensions} />
        </div>
      </ReportSection>

      {assessment.naturalRecommendations.length > 0 ? (
        <ReportSection title="Natural steps first">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Everyday habits and gentle natural routines to try before formulated
            products.
          </p>
          <ul className="space-y-2">
            {assessment.naturalRecommendations.map((item) => (
              <li key={item.id} className="flex gap-2.5 text-sm">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <ReportApplicationSchedule
                    applicationTime={item.applicationTime}
                    applicationFrequency={item.applicationFrequency}
                    className="mt-1"
                  />
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </ReportSection>
      ) : null}

      <ReportSection title="Recommended Aurora products">
        <ReportProductList products={assessment.recommendations} />
      </ReportSection>

      <div className="bg-muted/30 px-3 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {assessment.disclaimer}
        </p>
      </div>
    </div>
  )
}
