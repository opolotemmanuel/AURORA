// Spec section 2 — four equal-height summary cards instead of paragraphs.
import { IconActivity, IconCalendar, IconShieldCheck, IconSparkles } from "@tabler/icons-react"

import { Card, CardContent } from "@/components/ui/card"
import type { BadgeVariant } from "@/lib/reports/band-visuals"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

const VALUE_COLOR: Record<BadgeVariant, string> = {
  default: "text-foreground",
  secondary: "text-primary",
  destructive: "text-destructive",
  outline: "text-muted-foreground",
}

export function ExecutiveSummaryCards({ vm }: { vm: ReportViewModel }) {
  const { executiveSummary } = vm

  const cards = [
    { icon: IconSparkles, subtitle: "Overall Skin Score", value: executiveSummary.overallLabel, variant: executiveSummary.overallBadgeVariant },
    { icon: IconShieldCheck, subtitle: "AI Confidence", value: executiveSummary.confidenceLabel, variant: executiveSummary.confidenceBadgeVariant },
    { icon: IconActivity, subtitle: "Skin Risk Level", value: executiveSummary.riskLabel, variant: executiveSummary.riskBadgeVariant },
    { icon: IconCalendar, subtitle: "Scan Date", value: executiveSummary.scanDateLabel, variant: "outline" as const },
  ]

  return (
    <div className="space-y-3 print:break-inside-avoid">
      <h2 className="font-heading text-lg font-semibold text-foreground">Executive Summary</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          // report-stat-tile: print-stylesheet hook (app/globals.css) —
          // these small stat cards lose their on-screen shadow/ring
          // grouping when the PDF flattens Card chrome, so print CSS gives
          // them a light tint instead, the same tinted-cell treatment
          // ClimateConditions already uses for its own stat cells.
          <Card key={card.subtitle} className="report-stat-tile h-full gap-3 py-5">
            <CardContent className="flex h-full flex-col gap-2">
              <card.icon className="size-5 text-primary" />
              <p className={`font-heading text-xl font-semibold ${VALUE_COLOR[card.variant]}`}>{card.value}</p>
              <p className="mt-auto text-xs tracking-wide text-muted-foreground uppercase">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
