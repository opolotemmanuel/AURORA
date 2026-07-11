import Link from "next/link"
import {
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconDownload,
  IconFileAnalytics,
  IconFilter,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react"

// Shared by app/(dashboard)/reports/page.tsx (a user's own reports) and
// app/(dashboard)/admin/scans/page.tsx (every user's reports, admin-gated by
// the parent admin/layout.tsx) — `basePath` is the only thing that differs
// between the two call sites (filter form target, refresh/pagination links).
// Row-level "View Report" links always point at /reports/[id], the one
// report-detail route both callers share.
import {
  REPORT_TABLE_PAGE_SIZE_OPTIONS,
  REPORT_TABLE_SORT_OPTIONS,
  getQueryString,
} from "@/lib/backend/report-table-query"
import type { ReportTableQuery, listReportsPage } from "@/lib/backend/report-store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportsPageResult = Awaited<ReturnType<typeof listReportsPage>>
type ReportRow = ReportsPageResult["reports"][number]

export function ReportsTable({
  basePath,
  query,
  result,
}: {
  basePath: string
  query: ReportTableQuery
  result: ReportsPageResult
}) {
  const { reports, pagination } = result
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total)

  return (
    <div className="space-y-5">
      <Card>
        <CardContent>
          <form action={basePath} className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto_auto]">
            <label className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="search"
                defaultValue={query.search}
                placeholder="Search report ID, user, product, summary"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              />
            </label>
            <Select name="aiSource" label="AI Source" value={query.aiSource} options={[
              ["", "All AI"],
              ["gemini", "Gemini"],
              ["fallback", "Fallback"],
            ]} />
            <Select name="status" label="Status" value={query.status} options={[
              ["", "All status"],
              ["completed", "Completed"],
              ["pending", "Pending"],
              ["failed", "Failed"],
              ["archived", "Archived"],
            ]} />
            <Select name="scanSource" label="Scan Source" value={query.scanSource} options={[
              ["", "All sources"],
              ["camera", "Camera"],
              ["upload", "Upload"],
            ]} />
            <Select name="dateRange" label="Date Range" value={query.dateRange} options={[
              ["", "All dates"],
              ["today", "Today"],
              ["week", "This Week"],
              ["month", "This Month"],
            ]} />
            <Select
              name="sort"
              label="Sort"
              value={query.sort}
              options={REPORT_TABLE_SORT_OPTIONS.map((option) => [option.value, option.label])}
            />
            <Button type="submit">
              <IconFilter className="size-4" />
              Filter
            </Button>
            <Button asChild variant="outline">
              <Link href={basePath}>
                <IconRefresh className="size-4" />
                Refresh
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{pagination.total}</span>
            <span>Total Reports</span>
            <span>·</span>
            <span>Page {pagination.page} of {pagination.pageCount}</span>
            <span>·</span>
            <span>{pagination.pageSize} per page</span>
          </div>
          {/* Intentionally non-functional (ToolbarButton always renders
              disabled) — placeholders for bulk actions that aren't built
              yet, not broken buttons. */}
          <div className="flex flex-wrap gap-2">
            <ToolbarButton label="Export" icon={IconDownload} />
            <ToolbarButton label="Bulk Archive" />
            <ToolbarButton label="Bulk Delete" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        {reports.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <Table className="min-w-[1320px]">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <TableHead><Checkbox aria-label="Select all reports" /></TableHead>
                    <TableHead>Report ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Scan Source</TableHead>
                    <TableHead>AI Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skin Summary</TableHead>
                    <TableHead>Recommendations</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell><Checkbox aria-label={`Select ${report.shortId}`} /></TableCell>
                      <TableCell>
                        <Link href={`/reports/${report.id}`} className="font-medium text-primary hover:underline">
                          {report.shortId}
                        </Link>
                      </TableCell>
                      <TableCell><UserCell report={report} /></TableCell>
                      <TableCell><Badge variant="secondary">{formatValue(report.scanSource)}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={report.aiSource === "gemini" ? "default" : "secondary"}>
                          {formatValue(report.aiSource)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === "failed" ? "destructive" : "default"}>
                          {formatValue(report.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <p className="max-w-72 truncate text-muted-foreground">{report.summary}</p>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {report.recommendationCount ? (
                          <div>
                            <p className="font-medium">{report.recommendationCount} Products</p>
                            <p className="max-w-44 truncate text-xs text-muted-foreground">
                              {report.recommendationNames.join(", ")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No recommendations</span>
                        )}
                      </TableCell>
                      <TableCell><DateCell value={report.createdAt} /></TableCell>
                      <TableCell><DateCell value={report.updatedAt} /></TableCell>
                      <TableCell><ActionsMenu reportId={report.id} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {reports.map((report) => (
                <article key={report.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/reports/${report.id}`} className="font-medium text-primary">
                        {report.shortId}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                    </div>
                    <Checkbox aria-label={`Select ${report.shortId}`} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatValue(report.scanSource)}</Badge>
                    <Badge variant={report.aiSource === "gemini" ? "default" : "secondary"}>
                      {formatValue(report.aiSource)}
                    </Badge>
                    <Badge variant={report.status === "failed" ? "destructive" : "default"}>
                      {formatValue(report.status)}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{report.summary}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <UserCell report={report} />
                    <ActionsMenu reportId={report.id} />
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="grid place-items-center px-4 py-16 text-center">
            <IconFileAnalytics className="size-10 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">No reports available.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Complete a scan to generate reports.</p>
          </div>
        )}
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div>
            Showing {start}-{end} of {pagination.total} reports · Last Updated {formatDate(result.lastUpdated)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PageSizeLinks basePath={basePath} query={query} />
            <PaginationLink basePath={basePath} query={query} page={pagination.page - 1} disabled={pagination.page <= 1}>
              <IconChevronLeft className="size-4" />
              Previous
            </PaginationLink>
            <span className="rounded-md border border-border bg-muted px-3 py-2 text-xs">
              {pagination.page}
            </span>
            <PaginationLink basePath={basePath} query={query} page={pagination.page + 1} disabled={pagination.page >= pagination.pageCount}>
              Next
              <IconChevronRight className="size-4" />
            </PaginationLink>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string
  label: string
  value?: string
  options: Array<[string, string]>
}) {
  return (
    <label className="sr-only">
      {label}
      <select name={name} defaultValue={value ?? ""} className="not-sr-only h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "all"} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  )
}

function UserCell({ report }: { report: ReportRow }) {
  const name = report.user.name ?? "Anonymous User"
  const email = report.user.email ?? "No email"

  return (
    <div className="flex min-w-44 items-center gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  )
}

function DateCell({ value }: { value: string }) {
  const date = new Date(value)

  return (
    <div className="whitespace-nowrap">
      <p>{date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</p>
      <p className="text-xs text-muted-foreground">{date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
    </div>
  )
}

function ActionsMenu({ reportId }: { reportId: string }) {
  return (
    <details className="relative">
      <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground">
        <IconDotsVertical className="size-4" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg">
        <MenuLink href={`/reports/${reportId}`} label="View Report" />
        <MenuLink href={`/api/reports/${reportId}/print`} label="Print" />
        <MenuLink href={`/api/reports/${reportId}/download`} label="Download PDF" />
        <MenuLink href={`/api/reports/${reportId}`} label="View Recommendations" />
        {/* MenuButton always renders `disabled` — these are roadmap
            placeholders (see the "detail" text), not broken actions. */}
        <MenuButton label="Archive" detail="Backend pending" />
        <MenuButton label="Delete" detail="Backend pending" />
        <MenuButton label="Share" detail="Future" />
        <MenuButton label="Email" detail="Future" />
      </div>
    </details>
  )
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="block rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">{label}</Link>
}

function MenuButton({ label, detail }: { label: string; detail: string }) {
  return (
    <button disabled className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-muted-foreground">
      <span>{label}</span>
      <span className="text-xs">{detail}</span>
    </button>
  )
}

function ToolbarButton({ label, icon: Icon }: { label: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Button type="button" variant="outline" size="sm" disabled>
      {Icon ? <Icon className="size-4" /> : null}
      {label}
    </Button>
  )
}

function PaginationLink({
  basePath,
  query,
  page,
  disabled,
  children,
}: {
  basePath: string
  query: ReportTableQuery
  page: number
  disabled: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
        {children}
      </span>
    )
  }

  return (
    <Link
      href={`${basePath}?${getQueryString({ ...query, page })}`}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  )
}

function PageSizeLinks({ basePath, query }: { basePath: string; query: ReportTableQuery }) {
  return (
    <div className="flex items-center gap-1">
      {REPORT_TABLE_PAGE_SIZE_OPTIONS.map((pageSize) => (
        <Link
          key={pageSize}
          href={`${basePath}?${getQueryString({ ...query, page: 1, pageSize })}`}
          className={cn(
            "rounded-md border border-border px-2 py-2 text-xs",
            query.pageSize === pageSize ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {pageSize}
        </Link>
      ))}
    </div>
  )
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function formatValue(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
