import { formatBand } from "@/lib/scan/format"
import type { SkinDimension } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ReportDimensionTableProps = {
  dimensions: SkinDimension[]
  className?: string
}

export function ReportDimensionTable({
  dimensions,
  className,
}: ReportDimensionTableProps) {
  if (dimensions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No dimension data available.</p>
    )
  }

  return (
    <div className={cn("grid gap-3 font-sans sm:grid-cols-2", className)}>
      {dimensions.map((dimension) => (
        <div
          key={dimension.id}
          className="bg-muted/20 space-y-1 rounded-sm p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {dimension.label}
            </p>
            <p className="shrink-0 text-sm font-medium text-foreground">
              {formatBand(dimension.band)}
            </p>
          </div>
          {dimension.note ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {dimension.note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
