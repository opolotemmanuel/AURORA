"use client"

import { formatBand, formatSkinHeadline } from "@/lib/scan/format"
import type { SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type SkinReportContentProps = {
  assessment: SkinAssessment
  className?: string
}

export function SkinReportContent({
  assessment,
  className,
}: SkinReportContentProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-3">
        <p className="font-display text-2xl text-foreground sm:text-3xl">
          Your skin is {formatSkinHeadline(assessment.overallBand)}
        </p>
        <div className="inline-flex rounded-full border border-border bg-muted/40 px-4 py-1.5">
          <span className="font-heading text-sm font-semibold text-foreground">
            Overall: {formatBand(assessment.overallBand)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
      </div>

      <div className="space-y-2">
        <p className="font-heading text-sm font-semibold text-foreground">
          Dimensions
        </p>
        <div className="grid gap-2">
          {assessment.dimensions.map((dimension) => (
            <div
              key={dimension.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {dimension.label}
                </p>
                <p className="text-xs text-muted-foreground">{dimension.note}</p>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                {formatBand(dimension.band)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-heading text-sm font-semibold text-foreground">
          Aurora recommendations
        </p>
        <div className="space-y-2">
          {assessment.recommendations.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border p-3"
            >
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        {assessment.disclaimer}
      </p>
    </div>
  )
}
