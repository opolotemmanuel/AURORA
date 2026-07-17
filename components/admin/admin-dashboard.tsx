import type { ReactNode } from "react"
import { IconCheck, IconX } from "@tabler/icons-react"

// Renders the data getAdminAnalytics() assembles — this component is pure
// presentation, no data fetching of its own (see
// app/(dashboard)/admin/analytics/page.tsx for where it's actually called).
import type { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import type { LiveCheck } from "@/lib/backend/system-overview"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { BarTrendChart } from "@/components/admin/analytics/bar-trend-chart"
import { RankedList, type RankedRow } from "@/components/admin/analytics/ranked-list"

type Analytics = Awaited<ReturnType<typeof getAdminAnalytics>>

export function AdminDashboard({ analytics }: { analytics: Analytics }) {
  const { platformHealth, topFindings, topProducts, featureAdoption, roleBreakdown } = analytics

  const findingsRows: RankedRow[] = topFindings.map((finding) => ({
    key: `${finding.label}-${finding.band}`,
    label: `${finding.label} · ${formatValue(finding.band)}`,
    value: `${finding.percent}%`,
    detail: `${finding.count} finding${finding.count === 1 ? "" : "s"}`,
  }))

  const productRows: RankedRow[] = topProducts.map((product) => ({
    key: product.name,
    label: product.name,
    value: String(product.count),
  }))

  const adoptionRows: RankedRow[] = [
    { key: "dosha", label: "Completed dosha profile", value: `${featureAdoption.doshaPercent}%` },
    { key: "chat", label: "Used report chat or skin advice", value: `${featureAdoption.chatPercent}%` },
    { key: "repeat", label: "Returned for a repeat scan", value: `${featureAdoption.repeatScanPercent}%` },
  ]

  const roleRows: RankedRow[] = roleBreakdown.map((row) => ({
    key: row.role,
    label: formatValue(row.role),
    value: String(row.count),
    detail: `${row.percent}% of users`,
  }))

  return (
    <div className="space-y-8">
      <Section label="Platform health">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          <GeminiReliabilityTile reliability={platformHealth.geminiReliability} />
          <MetricTile label="Total users" value={String(platformHealth.totalUsers)} />
          <MetricTile label="Active products" value={String(platformHealth.activeProducts)} />
          <MetricTile label="Scans this week" value={String(platformHealth.scansThisWeek)} />
          <ReachabilityTile label={platformHealth.database.label} check={platformHealth.database} />
          <ReachabilityTile label={platformHealth.weather.label} check={platformHealth.weather} />
        </div>
      </Section>

      <Divider />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Section label="Scans over time">
          <Card>
            <CardContent>
              <BarTrendChart points={analytics.scanTrend} emptyLabel="No scans recorded in the last 14 days." />
            </CardContent>
          </Card>
        </Section>
        <Section label="Most common findings">
          <Card>
            <CardContent>
              <RankedList rows={findingsRows} emptyLabel="No cosmetic findings have been recorded yet." />
            </CardContent>
          </Card>
        </Section>
      </div>

      <Divider />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section label="Top recommended products">
          <Card>
            <CardContent>
              <RankedList rows={productRows} emptyLabel="No product recommendations have been recorded yet." />
            </CardContent>
          </Card>
        </Section>
        <Section label="Feature adoption">
          <Card>
            <CardContent>
              <RankedList rows={adoptionRows} emptyLabel="No users yet." />
            </CardContent>
          </Card>
        </Section>
      </div>

      <Divider />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section label="User growth">
          <Card>
            <CardContent>
              <BarTrendChart points={analytics.signupTrend} emptyLabel="No signups in the last 14 days." />
            </CardContent>
          </Card>
        </Section>
        <Section label="Role breakdown">
          <Card>
            <CardContent>
              <RankedList rows={roleRows} emptyLabel="No users yet." />
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      {children}
    </section>
  )
}

function Divider() {
  return <hr className="border-t-[0.5px] border-border" />
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
    </div>
  )
}

function GeminiReliabilityTile({
  reliability,
}: {
  reliability: Analytics["platformHealth"]["geminiReliability"]
}) {
  const hasData = reliability.ratePercent !== null
  const value = hasData ? `${reliability.ratePercent}%` : "No data yet"

  return (
    <div className={cn("rounded-lg p-4", reliability.isLow ? "bg-destructive/10" : "bg-muted")}>
      <p className={cn("text-[13px]", reliability.isLow ? "text-destructive" : "text-muted-foreground")}>
        Gemini reliability
      </p>
      <p className={cn("mt-1 text-2xl font-medium", reliability.isLow ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
      {hasData ? (
        <p className={cn("mt-1 text-xs", reliability.isLow ? "text-destructive/80" : "text-muted-foreground")}>
          {reliability.successCount} of {reliability.totalCount} calls succeeded
        </p>
      ) : null}
    </div>
  )
}

function ReachabilityTile({ label, check }: { label: string; check: LiveCheck }) {
  const isReachable = check.status === "reachable"
  const isUnreachable = check.status === "unreachable"
  const Icon = isReachable ? IconCheck : IconX
  const toneClass = isReachable ? "text-success" : isUnreachable ? "text-destructive" : "text-muted-foreground"
  const statusText = isReachable ? "Reachable" : isUnreachable ? "Unreachable" : "Not configured"

  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 flex items-center gap-1.5 text-sm font-medium", toneClass)}>
        <Icon className="size-4" />
        {statusText}
      </p>
    </div>
  )
}

// Turns enum-ish values like "not_visible" or "ADMIN" into "Not Visible" /
// "Admin" for display.
function formatValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
