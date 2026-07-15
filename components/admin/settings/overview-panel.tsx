// Pure presentation for the Enterprise Settings "Overview" tab — all data
// comes pre-computed from lib/backend/system-overview.ts (real live checks
// and real Postgres counts), this component just lays it out. See
// app/(dashboard)/settings/page.tsx for the caller.
import type { ComponentType } from "react"
import {
  IconCircleCheck,
  IconCircleX,
  IconClockQuestion,
  IconDatabase,
  IconPhotoScan,
  IconSparkles,
  IconTag,
  IconUsers,
} from "@tabler/icons-react"

import type { LiveCheck } from "@/lib/backend/system-overview"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function OverviewPanel({
  platformVersion,
  checks,
  counts,
}: {
  platformVersion: string
  checks: LiveCheck[]
  counts: { totalUsers: number; activeProducts: number; todayScans: number }
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IconTag} label="Platform version" value={platformVersion} detail="From package.json" />
        <StatCard icon={IconUsers} label="Total users" value={String(counts.totalUsers)} detail="Real PostgreSQL user count" />
        <StatCard icon={IconSparkles} label="Active products" value={String(counts.activeProducts)} detail="Products live in the recommendation engine" />
        <StatCard icon={IconPhotoScan} label="Scans today" value={String(counts.todayScans)} detail="Since local midnight" />
      </section>

      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconDatabase className="size-4" />
            Live System Checks
          </p>
          <CardTitle className="mt-2">Service reachability</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">
            Each row is a real check performed when this page loaded — a live database query, a real Open-Meteo
            request, and the most recently recorded Gemini call. Nothing here is a fabricated status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {checks.map((check) => (
            <div
              key={check.label}
              className="grid gap-2 rounded-lg border border-border bg-muted p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {check.detail}
                  {typeof check.latencyMs === "number" ? ` (${check.latencyMs}ms)` : ""}
                </p>
              </div>
              <LiveStatusBadge status={check.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LiveStatusBadge({ status }: { status: LiveCheck["status"] }) {
  if (status === "reachable") {
    return (
      <Badge variant="default" className="gap-1.5">
        <IconCircleCheck className="size-3.5" />
        Reachable
      </Badge>
    )
  }

  if (status === "unreachable") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <IconCircleX className="size-3.5" />
        Unreachable
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <IconClockQuestion className="size-3.5" />
      Not configured
    </Badge>
  )
}
