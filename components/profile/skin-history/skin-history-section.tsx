import { IconChartLine, IconShieldCheck } from "@tabler/icons-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ConcernTrend } from "@/lib/reports/skin-history"

import { ConcernTrendChart } from "./concern-trend-chart"

export function SkinHistorySection({ trends }: { trends: ConcernTrend[] }) {
  const hasAnyData = trends.some((trend) => trend.points.length > 0)

  return (
    <div className="space-y-6">
      {hasAnyData ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {trends.map((trend) => (
            <ConcernTrendChart key={trend.concern} trend={trend} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <IconChartLine className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No trend data yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Take a couple of scans and your skin history trends will show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          These charts track how your own cosmetic readings have moved between scans — a self-observation trend,
          not a medical trend line. A reading moving up or down isn&apos;t inherently good or bad; it simply
          reflects what changed. This is not a diagnosis and does not replace consultation with a qualified
          healthcare professional.
        </p>
      </div>
    </div>
  )
}
