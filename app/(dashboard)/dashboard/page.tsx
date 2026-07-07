import Link from "next/link"
import {
  IconAlertTriangle,
  IconCamera,
  IconDownload,
  IconPhotoScan,
  IconReportAnalytics,
  IconSparkles,
} from "@tabler/icons-react"

import {
  listAiProviderEvents,
  listDownloads,
  listReportsPage,
  listScans,
  saveAuditLog,
} from "@/lib/backend/report-store"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [scans, reportPage, fallbackReportPage, downloads, aiEvents] = await Promise.all([
    listScans(),
    listReportsPage({ page: 1, pageSize: 25, sort: "newest" }),
    listReportsPage({ page: 1, pageSize: 25, aiSource: "fallback", sort: "newest" }),
    listDownloads(),
    listAiProviderEvents(),
  ])

  await saveAuditLog({
    action: "Viewed dashboard overview",
    targetType: "admin",
    targetId: "dashboard",
  })

  const sourceCounts = countBy(scans.map((scan) => scan.source))
  const recentReports = reportPage.reports.slice(0, 5)
  const recentProviderEvents = aiEvents.slice(0, 3)

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconSparkles className="size-4" />
          Aurora SkinSense
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Real backend overview for cosmetic scan activity, persisted reports, downloads, and AI provider events.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total scans" value={scans.length} detail="Persisted scan records" icon={IconPhotoScan} />
        <MetricCard label="Reports" value={reportPage.pagination.total} detail="Saved cosmetic reports" icon={IconReportAnalytics} />
        <MetricCard label="Fallback reports" value={fallbackReportPage.pagination.total} detail="Fallback cosmetic guidance" icon={IconAlertTriangle} />
        <MetricCard label="Downloads" value={downloads.length} detail="Tracked report print/download events" icon={IconDownload} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Recent Reports" description="Latest cosmetic reports saved in PostgreSQL">
          {recentReports.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium">Report</th>
                    <th className="px-3 py-3 font-medium">AI</th>
                    <th className="px-3 py-3 font-medium">Summary</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id} className="border-t border-border hover:bg-muted/60">
                      <td className="px-3 py-3">
                        <Link href={`/api/reports/${report.id}/print`} className="font-medium text-primary hover:underline">
                          {report.shortId}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{formatValue(report.aiSource)}</td>
                      <td className="px-3 py-3"><p className="max-w-72 truncate text-muted-foreground">{report.summary}</p></td>
                      <td className="px-3 py-3 text-muted-foreground">{formatDate(report.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState label="No cosmetic reports have been created yet. Completed scans will appear here." />
          )}
        </Panel>

        <Panel title="Scan Sources" description="Counts from persisted scan records">
          {Object.keys(sourceCounts).length ? (
            <div className="space-y-3">
              {Object.entries(sourceCounts).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <IconCamera className="size-4 text-primary" />
                    {formatValue(source)}
                  </span>
                  <span className="text-2xl font-semibold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No scan source records exist yet." />
          )}
        </Panel>
      </section>

      <Panel title="AI Provider Events" description="Most recent Gemini success/fallback records">
        {recentProviderEvents.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {recentProviderEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border bg-muted p-4">
                <p className="text-sm font-medium">{formatValue(event.status)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.provider} - {event.model}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No AI provider events have been recorded yet." />
        )}
      </Panel>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: number
  detail: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">{label}</div>
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function formatValue(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
