import { BandBadge } from "@/components/scan/band-badge"
import {
  formatBandScaleHint,
  formatSkinHeadline,
} from "@/lib/scan/format"
import type { AssessmentBand } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ReportBandDisplayProps = {
  band: AssessmentBand
  size?: "sm" | "md"
  showScaleHint?: boolean
  className?: string
}

export function ReportBandDisplay({
  band,
  size = "md",
  showScaleHint = true,
  className,
}: ReportBandDisplayProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <BandBadge band={band} size={size} variant="chip" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {formatSkinHeadline(band)}
      </p>
      {showScaleHint ? (
        <p className="text-xs text-muted-foreground">{formatBandScaleHint()}</p>
      ) : null}
    </div>
  )
}
