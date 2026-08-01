import Link from "next/link"
import {
  IconDotsVertical,
  IconFileAnalytics,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react"

// Shared by app/(dashboard)/reports/page.tsx (a user's own reports) and
// app/(dashboard)/admin/scans/page.tsx (every user's reports, admin-gated by
// the parent admin/layout.tsx) — `basePath` is the only thing that differs
// between the two call sites (filter form target, refresh/pagination links).
// Row-level "View Report" links always point at /reports/[id], the one
// report-detail route both callers share.
//
// Console-style redesign: the old dropdown filters are now removable chips
// and the sort <select> is now clickable column headers, but everything
// still resolves to the exact same query params this table already
// supported (search/aiSource/status/scanSource/dateRange/sort/page/
// pageSize) via the exact same parseReportQuery/getReportOrderBy/
// listReportsPage server-side pipeline — real pagination and real filtering
// over the full Report table, never a client-side slice of one page. Kept
// as a Server Component; the one Client Component island is
// ExportCsvButton, since building/downloading a CSV needs the browser.
import {
  REPORT_TABLE_PAGE_SIZE_OPTIONS,
  getQueryString,
} from "@/lib/backend/report-table-query"
import type { ReportTableQuery, listReportsPage } from "@/lib/backend/report-store"
import { cn } from "@/lib/utils"
import { SingleSelectFilterChips } from "@/components/admin/filter-chip-bar"
import { PaginationFooter } from "@/components/admin/pagination-footer"
import { SortableHeader } from "@/components/admin/sortable-header"
import { ExportCsvButton } from "@/components/report/export-csv-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportsPageResult = Awaited<ReturnType<typeof listReportsPage>>
type ReportRow = ReportsPageResult["reports"][number]

const AI_SOURCE_OPTIONS = [
  { value: "gemini", label: "Gemini" },
  { value: "fallback", label: "Fallback" },
]

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "archived", label: "Archived" },
]

const SCAN_SOURCE_OPTIONS = [
  { value: "camera", label: "Camera" },
  { value: "upload", label: "Upload" },
]

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
]

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

  // Every filter chip and sort header below resolves to this same
  // getQueryString/parseReportQuery pair the old dropdowns and pagination
  // links already used — changing a facet always resets to page 1, same as
  // the old form submit did.
  function facetHref(overrides: Partial<ReportTableQuery>) {
    return `${basePath}?${getQueryString({ ...query, page: 1, ...overrides })}`
  }

  // Unlike facetHref, Refresh isn't changing any filter/sort, so it must
  // not reset the current page — it re-requests the exact same view.
  const refreshHref = `${basePath}?${getQueryString(query)}`

  const createdSortHref = facetHref({ sort: query.sort === "oldest" ? "newest" : "oldest" })
  const createdSortActive = query.sort === "newest" || query.sort === "oldest"
  const createdSortDirection = query.sort === "oldest" ? "asc" : "desc"

  const csvHeaders = ["Report ID", "User", "Email", "Scan Source", "AI Source", "Status", "Summary", "Recommendations", "Created", "Updated"]
  const csvRows = reports.map((report) => [
    report.shortId,
    report.user.name ?? "Anonymous User",
    report.user.email ?? "",
    formatValue(report.scanSource),
    formatValue(report.aiSource),
    formatValue(report.status),
    report.summary,
    report.recommendationNames.join("; "),
    report.createdAt,
    report.updatedAt,
  ])

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4">
          <form action={basePath} className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-56 flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="search"
                defaultValue={query.search}
                placeholder="Search report ID, user, product, summary"
                className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm"
              />
            </label>
            <input type="hidden" name="aiSource" value={query.aiSource ?? ""} />
            <input type="hidden" name="status" value={query.status ?? ""} />
            <input type="hidden" name="scanSource" value={query.scanSource ?? ""} />
            <input type="hidden" name="dateRange" value={query.dateRange ?? ""} />
            <input type="hidden" name="sort" value={query.sort} />
            <input type="hidden" name="pageSize" value={query.pageSize} />
            <Button type="submit">
              <IconSearch className="size-4" />
              Search
            </Button>
            <Button asChild variant="outline">
              <Link href={refreshHref}>
                <IconRefresh className="size-4" />
                Refresh
              </Link>
            </Button>
            <ExportCsvButton
              filename={`scans-${new Date().toISOString().slice(0, 10)}.csv`}
              headers={csvHeaders}
              rows={csvRows}
              label="Export CSV (this page)"
              disabled={reports.length === 0}
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <SingleSelectFilterChips
              value={query.aiSource ?? "all"}
              options={AI_SOURCE_OPTIONS}
              getHref={(value) => facetHref({ aiSource: value === "all" ? undefined : (value as ReportTableQuery["aiSource"]) })}
              addLabel="AI Source"
            />
            <SingleSelectFilterChips
              value={query.status ?? "all"}
              options={STATUS_OPTIONS}
              getHref={(value) => facetHref({ status: value === "all" ? undefined : (value as ReportTableQuery["status"]) })}
              addLabel="Status"
            />
            <SingleSelectFilterChips
              value={query.scanSource ?? "all"}
              options={SCAN_SOURCE_OPTIONS}
              getHref={(value) => facetHref({ scanSource: value === "all" ? undefined : (value as ReportTableQuery["scanSource"]) })}
              addLabel="Scan Source"
            />
            <SingleSelectFilterChips
              value={query.dateRange ?? "all"}
              options={DATE_RANGE_OPTIONS}
              getHref={(value) => facetHref({ dateRange: value === "all" ? undefined : (value as ReportTableQuery["dateRange"]) })}
              addLabel="Date Range"
            />
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{pagination.total}</span>
            <span>Total Reports</span>
            <span>·</span>
            <span>Last Updated {formatDate(result.lastUpdated)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        {reports.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <Table className="min-w-[1250px]">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <SortableHeader label="Report ID" active={query.sort === "reportId"} href={facetHref({ sort: "reportId" })} />
                    <TableHead>User</TableHead>
                    <TableHead>Scan Source</TableHead>
                    <SortableHeader label="AI Source" active={query.sort === "aiSource"} href={facetHref({ sort: "aiSource" })} />
                    <SortableHeader label="Status" active={query.sort === "status"} href={facetHref({ sort: "status" })} />
                    <TableHead>Skin Summary</TableHead>
                    <TableHead>Recommendations</TableHead>
                    <SortableHeader
                      label="Created"
                      active={createdSortActive}
                      direction={createdSortActive ? createdSortDirection : undefined}
                      href={createdSortHref}
                    />
                    <SortableHeader label="Updated" active={query.sort === "updated"} href={facetHref({ sort: "updated" })} />
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
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

      <PaginationFooter
        start={start}
        end={end}
        total={pagination.total}
        itemLabel="reports"
        page={pagination.page}
        pageCount={pagination.pageCount}
        prev={pagination.page > 1 ? { href: `${basePath}?${getQueryString({ ...query, page: pagination.page - 1 })}` } : null}
        next={
          pagination.page < pagination.pageCount
            ? { href: `${basePath}?${getQueryString({ ...query, page: pagination.page + 1 })}` }
            : null
        }
        extra={<PageSizeLinks basePath={basePath} query={query} />}
      />
    </div>
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
        {/* Plain <a>, not <Link> — this route streams a real PDF file with
            Content-Disposition: attachment (see the download route
            handler). next/link's Link intercepts same-origin clicks for
            client-side soft navigation (and prefetches on hover/viewport by
            default), so the browser never sees it as a genuine top-level
            navigation and never applies the attachment header — the PDF
            bytes just render inline instead of downloading. A native
            anchor forces a real browser navigation, which honors the
            header correctly and doesn't risk prefetch firing this
            expensive (headless-Chrome-rendered, DB-logged) route early. */}
        <a
          href={`/api/reports/${reportId}/download`}
          className="block rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Download PDF
        </a>
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
