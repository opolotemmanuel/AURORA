import type { ComponentType, ReactNode } from "react"
import {
  IconAlertTriangle,
  IconCamera,
  IconCheck,
  IconDatabase,
  IconDownload,
  IconPhotoScan,
  IconReportAnalytics,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react"

import type { getAdminAnalytics } from "@/lib/backend/admin-analytics"

type IconComponent = ComponentType<{ className?: string }>
type BackendAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>
type MetricTone = "default" | "attention" | "success"
type Metric = {
  label: "Total scans" | "Completed reports" | "Fallback reports" | "PDF downloads"
  value: string
  detail: string
  tone: MetricTone
}

const metricIcons: Record<Metric["label"], IconComponent> = {
  "Total scans": IconPhotoScan,
  "Completed reports": IconReportAnalytics,
  "Fallback reports": IconAlertTriangle,
  "PDF downloads": IconDownload,
}

export function AdminDashboard({ backendAnalytics }: { backendAnalytics: BackendAnalytics }) {
  const metrics = getDisplayMetrics(backendAnalytics)
  const scanById = new Map(backendAnalytics.recentScans.map((scan) => [scan.id, scan]))
  const reportRows = backendAnalytics.recentReports.map((report) => {
    const scan = scanById.get(report.scanId)

    return {
      id: report.id,
      user: report.userId ?? "Anonymous scan",
      source: formatValue(scan?.source ?? "unknown"),
      status: report.analysis.source === "fallback" ? "Fallback report" : "Report ready",
      recommendation: report.recommendations[0]?.product.name ?? "No recommendation recorded",
      pdfDownloads: backendAnalytics.downloads.filter((download) => download.reportId === report.id).length,
      createdAt: formatDate(report.createdAt),
    }
  })

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconSparkles className="size-4" />
            Aurora SkinSense Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Phase 1 Control Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Live operational view for persisted cosmetic scan reports, product recommendations,
            downloads, provider events, and admin audit activity.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Using PostgreSQL records through Prisma.
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} icon={metricIcons[metric.label]} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Recommendation Counts" description="Products recommended in persisted reports" icon={IconReportAnalytics}>
          <CountList
            counts={backendAnalytics.productRecommendations}
            emptyLabel="No product recommendations have been recorded yet."
          />
        </Panel>

        <Panel title="Scan Sources" description="Persisted scan input source counts" icon={IconCamera}>
          <CountList counts={backendAnalytics.scanSources} emptyLabel="No scan records have been created yet." />
        </Panel>
      </section>

      <Panel title="Scan And Report Tracking" description="Latest reports saved in PostgreSQL" icon={IconDatabase}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1fr_1fr_0.8fr_1fr_1.2fr_0.7fr] gap-4 border-b border-border bg-muted px-4 py-3 text-xs font-medium text-muted-foreground">
              <span>Report</span>
              <span>User</span>
              <span>Source</span>
              <span>Status</span>
              <span>Recommendation</span>
              <span>Downloads</span>
            </div>
            {reportRows.map((report) => (
              <div
                key={report.id}
                className="grid grid-cols-[1fr_1fr_0.8fr_1fr_1.2fr_0.7fr] gap-4 border-b border-border px-4 py-4 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium">{report.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{report.createdAt}</p>
                </div>
                <span className="text-muted-foreground">{report.user}</span>
                <span>{report.source}</span>
                <span>{report.status}</span>
                <span className="text-muted-foreground">{report.recommendation}</span>
                <span>{report.pdfDownloads}</span>
              </div>
            ))}
            {reportRows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">No reports have been saved yet.</div>
            ) : null}
          </div>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Gemini Provider Events" description="Provider calls and fallback records saved by the backend" icon={IconSparkles}>
          <div className="space-y-3">
            {backendAnalytics.aiProviderEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border bg-muted p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{event.status}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.provider} - {event.model}
                    </p>
                  </div>
                  <span className="text-right text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                </div>
                {event.reason ? <p className="mt-3 text-sm text-muted-foreground">{event.reason}</p> : null}
              </div>
            ))}
            {backendAnalytics.aiProviderEvents.length === 0 ? (
              <EmptyState label="No AI provider events have been recorded yet." />
            ) : null}
          </div>
        </Panel>

        <Panel title="Report Downloads" description="Tracked printable report access" icon={IconDownload}>
          <div className="space-y-3">
            {backendAnalytics.downloads.map((download) => (
              <div key={download.id} className="rounded-lg border border-border bg-muted p-4">
                <p className="text-sm font-medium">{download.reportId}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatValue(download.format)} - {formatDate(download.createdAt)}
                </p>
              </div>
            ))}
            {backendAnalytics.downloads.length === 0 ? (
              <EmptyState label="No report downloads or print views have been recorded yet." />
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="System Status" description="Configuration and retention status from the running server" icon={IconShieldCheck}>
          <div className="space-y-3">
            {backendAnalytics.systemStatus.map((item) => (
              <StatusRow key={item.label} label={item.label} value={item.status} detail={item.detail} />
            ))}
          </div>
        </Panel>

        <Panel title="Audit Trail" description="Admin actions recorded in PostgreSQL" icon={IconCheck}>
          <div className="space-y-3">
            {backendAnalytics.auditLogs.map((event) => (
              <div key={event.id} className="rounded-lg border border-border bg-muted p-4">
                <p className="text-sm font-medium">{event.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(event.actorId ?? "system")} - {event.targetType}:{event.targetId} - {formatDate(event.createdAt)}
                </p>
              </div>
            ))}
            {backendAnalytics.auditLogs.length === 0 ? <EmptyState label="No audit events have been recorded yet." /> : null}
          </div>
        </Panel>
      </section>

      <Panel title="Admin Protection" description="Current access-control configuration" icon={IconShieldCheck}>
        <StatusRow label={backendAnalytics.auth.mode} value="Placeholder only" detail={backendAnalytics.auth.note} />
      </Panel>
    </div>
  )
}

function getDisplayMetrics(backendAnalytics: BackendAnalytics): Metric[] {
  return [
    {
      label: "Total scans",
      value: String(backendAnalytics.metrics.totalScans),
      detail: "Persisted scan records",
      tone: "default",
    },
    {
      label: "Completed reports",
      value: String(backendAnalytics.metrics.completedReports),
      detail: "Reports saved in PostgreSQL",
      tone: "success",
    },
    {
      label: "Fallback reports",
      value: String(backendAnalytics.metrics.fallbackReports),
      detail: "Reports generated by fallback flow",
      tone: "attention",
    },
    {
      label: "PDF downloads",
      value: String(backendAnalytics.metrics.reportDownloads),
      detail: "Tracked report print/download events",
      tone: "default",
    },
  ]
}

function MetricCard({ metric, icon: Icon }: { metric: Metric; icon: IconComponent }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{metric.detail}</p>
    </div>
  )
}

function Panel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: IconComponent
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function CountList({ counts, emptyLabel }: { counts: Record<string, number>; emptyLabel: string }) {
  const rows = Object.entries(counts).sort(([, a], [, b]) => b - a)

  if (rows.length === 0) return <EmptyState label={emptyLabel} />

  return (
    <div className="space-y-3">
      {rows.map(([label, count]) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
          <span className="text-sm font-medium">{formatValue(label)}</span>
          <span className="text-2xl font-semibold">{count}</span>
        </div>
      ))}
    </div>
  )
}

function StatusRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{formatValue(label)}</span>
        <span className="text-right text-xs font-medium text-muted-foreground">{value}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
      {label}
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function formatValue(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
