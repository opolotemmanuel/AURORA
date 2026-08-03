import Link from "next/link"
import { IconChartLine } from "@tabler/icons-react"

import { MIN_TREND_POINTS } from "@/lib/reports/skin-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Shared per-concern empty state for ConcernTrendChart (used whenever that
// concern has fewer than MIN_TREND_POINTS real points). The wavy path below
// is a fixed decorative shape, not derived from any data — it never plots
// pointsCount or any real value, so it can't be mistaken for an actual
// reading (same "coarse, honest output only" rule the real chart follows).
const GHOST_PATH = "M4,40 C40,10 70,55 104,25 S170,50 200,20 S266,45 300,15 S366,40 396,22"

export function ConcernTrendEmptyState({ label, pointsCount }: { label: string; pointsCount: number }) {
  const progressPercent = Math.min(100, Math.round((pointsCount / MIN_TREND_POINTS) * 100))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <svg viewBox="0 0 400 70" className="h-16 w-full text-muted-foreground/30" aria-hidden="true">
          <path
            d={GHOST_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <IconChartLine className="size-4 shrink-0" />
            {pointsCount} of {MIN_TREND_POINTS} scans needed to unlock your {label.toLowerCase()} trend
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <Button asChild size="sm">
          <Link href="/scan">Take a scan</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
