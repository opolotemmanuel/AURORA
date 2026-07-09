// Spec section 5. Horizontal bars, no numbers — fillRatio only sizes the
// bar width (see lib/reports/band-visuals.ts). Animated in the web view via
// `transition-all`; the PDF pipeline prints whatever width is already
// committed at render time, so it comes out static automatically.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function SkinMetrics({ vm }: { vm: ReportViewModel }) {
  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>Skin Metrics</CardTitle>
        <CardDescription>Aura's read on each metric it was able to assess in this scan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {vm.metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{metric.label}</span>
              <span className="text-muted-foreground">{metric.tierLabel}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.round(metric.fillRatio * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
