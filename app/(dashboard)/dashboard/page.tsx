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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Latest cosmetic reports saved in PostgreSQL</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports.length ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>AI</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Link href={`/api/reports/${report.id}/print`} className="font-medium text-primary hover:underline">
                            {report.shortId}
                          </Link>
                        </TableCell>
                        <TableCell>{formatValue(report.aiSource)}</TableCell>
                        <TableCell className="whitespace-normal">
                          <p className="max-w-72 truncate text-muted-foreground">{report.summary}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(report.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState label="No cosmetic reports have been created yet. Completed scans will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan Sources</CardTitle>
            <CardDescription>Counts from persisted scan records</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider Events</CardTitle>
          <CardDescription>Most recent Gemini success/fallback records</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
    <Card>
      <CardContent>
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
      </CardContent>
    </Card>
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
