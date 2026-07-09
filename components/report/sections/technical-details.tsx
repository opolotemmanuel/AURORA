// Spec section 9.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function TechnicalDetails({ vm }: { vm: ReportViewModel }) {
  const { technicalDetails } = vm

  const rows = [
    { label: "Model Version", value: technicalDetails.modelVersion },
    { label: "Analysis Engine", value: technicalDetails.analysisEngine },
    { label: "Processing Time", value: technicalDetails.processingTime },
    { label: "Image Resolution", value: technicalDetails.imageResolution },
    { label: "Device", value: technicalDetails.device },
    { label: "Scan Timestamp", value: technicalDetails.scanTimestamp },
    { label: "Report Version", value: technicalDetails.reportVersion },
  ]

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>Technical Details</CardTitle>
        <CardDescription>Diagnostic metadata about how this report was produced.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">{row.label}</dt>
              <dd className="mt-1 font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
