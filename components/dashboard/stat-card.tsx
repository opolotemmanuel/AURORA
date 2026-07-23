import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// One tile in the main dashboard's stat-card row (app/(dashboard)/dashboard/
// page.tsx) — plain shadcn Card, not a hand-rolled bordered div, so it picks
// up the same background/ring/radius as every other card in the app rather
// than a one-off style (see AGENTS.md's "no one-off duplicates" UI rule).
export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <Card size="sm" className={cn(className)}>
      <CardContent className="space-y-1.5">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
        <p className="font-heading text-2xl font-semibold tracking-normal tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
