// Pure presentation for the Enterprise Settings "Overview" tab — all data
// comes pre-computed from lib/backend/system-overview.ts (real live checks
// and real Postgres counts), this component just lays it out. Status dot
// convention matches components/scan/ScanQualityPanel.tsx's StatusDot.
import type { ComponentType } from "react"
import {
  IconPhotoScan,
  IconRadar2,
  IconSparkles,
  IconTag,
  IconUsers,
} from "@tabler/icons-react"

import type { LiveCheck } from "@/lib/backend/system-overview"
import { cn } from "@/lib/utils"
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
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionLabel icon={IconRadar2} label="Live System Checks" />
        <Card>
          <CardHeader>
            <CardTitle>Service reachability</CardTitle>
            <CardDescription className="mt-2 max-w-3xl leading-6">
              Each row is a real check performed when this page loaded — a live database query, a real
              Open-Meteo request, and the most recently recorded Gemini call. Nothing here is a fabricated
              status.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {checks.map((check) => (
              <CheckCard key={check.label} check={check} />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionLabel icon={IconTag} label="Real-Time Counts" />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={IconTag} label="Platform version" value={platformVersion} detail="From package.json" />
          <StatCard icon={IconUsers} label="Total users" value={String(counts.totalUsers)} detail="Real PostgreSQL user count" />
          <StatCard icon={IconSparkles} label="Active products" value={String(counts.activeProducts)} detail="Live in the recommendation engine" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={IconPhotoScan} label="Scans today" value={String(counts.todayScans)} detail="Since local midnight" />
        </div>
      </section>
    </div>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
      <Icon className="size-4" />
      {label}
    </p>
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
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const STATUS_DOT_CLASSES: Record<LiveCheck["status"], string> = {
  reachable: "bg-success",
  unreachable: "bg-destructive",
  not_configured: "bg-muted-foreground",
}

const STATUS_BADGE_CLASSES: Record<LiveCheck["status"], string> = {
  reachable: "border-success/30 bg-success/10 text-success",
  unreachable: "border-destructive/30 bg-destructive/10 text-destructive",
  not_configured: "border-border bg-muted text-muted-foreground",
}

const STATUS_LABELS: Record<LiveCheck["status"], string> = {
  reachable: "Reachable",
  unreachable: "Unreachable",
  not_configured: "Not configured",
}

function CheckCard({ check }: { check: LiveCheck }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASSES[check.status])} />
          {check.label}
        </span>
        <Badge variant="outline" className={cn("shrink-0", STATUS_BADGE_CLASSES[check.status])}>
          {STATUS_LABELS[check.status]}
        </Badge>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {check.detail}
        {typeof check.latencyMs === "number" ? ` (${check.latencyMs}ms)` : ""}
      </p>
    </div>
  )
}
