// Floating glass-panel quality checklist shown below the live camera
// preview during the Capture step (see ScanFlow.tsx's CameraPanel).
// Runs entirely off client-side state from lib/scan/quality/use-scan-quality
// — this component never calls fetch/the backend itself.
import { IconLoader2 } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LandmarkerStatus } from "@/lib/scan/quality/use-scan-quality"
import type { QualityCheckResult, QualitySnapshot, QualityStatus } from "@/lib/scan/quality/types"

const SCORE_BAND_BADGE_VARIANT: Record<QualitySnapshot["scoreBand"], "secondary" | "outline" | "destructive"> = {
  Excellent: "secondary",
  Good: "secondary",
  Fair: "outline",
  Poor: "destructive",
}

export function ScanQualityPanel({
  snapshot,
  landmarkerStatus,
}: {
  snapshot: QualitySnapshot | null
  landmarkerStatus: LandmarkerStatus
}) {
  if (landmarkerStatus === "loading" && !snapshot) {
    return (
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" />
          Loading face detection…
        </CardContent>
      </Card>
    )
  }

  if (!snapshot) return null

  // The single most actionable line to show beneath the checklist: an
  // unmet hard gate first (that's what's actually blocking Capture), then
  // the first active soft warning if every gate already passes.
  const primaryIssue =
    snapshot.results.find((result) => result.severity === "gate" && result.status !== "pass") ??
    snapshot.results.find((result) => result.status === "warn")

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur-md">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm">Image quality</CardTitle>
        <Badge variant={SCORE_BAND_BADGE_VARIANT[snapshot.scoreBand]}>
          {snapshot.score}% · {snapshot.scoreBand}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {snapshot.results.map((result) => (
            <CheckRow key={result.id} result={result} />
          ))}
        </div>
        {primaryIssue?.message ? (
          <p className="border-t border-border/60 pt-3 text-xs leading-5 text-muted-foreground">
            {primaryIssue.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CheckRow({ result }: { result: QualityCheckResult }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <StatusDot status={result.status} />
      <span className="truncate">{result.label}</span>
    </div>
  )
}

const STATUS_DOT_CLASSES: Record<QualityStatus, string> = {
  pass: "bg-success",
  warn: "bg-warning",
  fail: "bg-destructive",
}

function StatusDot({ status }: { status: QualityStatus }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASSES[status])}
    />
  )
}
