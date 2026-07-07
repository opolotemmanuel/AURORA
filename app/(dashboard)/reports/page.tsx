import Link from "next/link"
import {
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconDownload,
  IconFileAnalytics,
  IconFilter,
  IconRefresh,
  IconReportAnalytics,
  IconSearch,
} from "@tabler/icons-react"

import {
  listReportsPage,
  saveAuditLog,
  type ReportTableQuery,
  type ReportTableSort,
} from "@/lib/backend/report-store"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const pageSizeOptions = [25, 50, 100] as const
const sortOptions: Array<{ value: ReportTableSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "reportId", label: "Report ID" },
  { value: "status", label: "Status" },
  { value: "aiSource", label: "AI Source" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
]

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams
  const query = parseReportQuery(params)
  const result = await listReportsPage(query)
  const { reports, pagination } = result
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total)

  await saveAuditLog({
    action: "Viewed reports table",
    targetType: "report",
    targetId: "reports-index",
  })

  return (
    <div className="space-y-5">
      <section className="border-b border-border pb-5">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconReportAnalytics className="size-4" />
          Reports
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage, search and export all Aurora SkinSense reports.
        </p>
      </section>

      <form className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto_auto]">
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
            options={sortOptions.map((option) => [option.value, option.label])}
          />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
            <IconFilter className="size-4" />
            Filter
          </button>
          <Link
            href="/reports"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <IconRefresh className="size-4" />
            Refresh
          </Link>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{pagination.total}</span>
          <span>Total Reports</span>
          <span>·</span>
          <span>Page {pagination.page} of {pagination.pageCount}</span>
          <span>·</span>
          <span>{pagination.pageSize} per page</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton label="Export" icon={IconDownload} />
          <ToolbarButton label="Bulk Archive" />
          <ToolbarButton label="Bulk Delete" />
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {reports.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <Th><input type="checkbox" aria-label="Select all reports" /></Th>
                    <Th>Report ID</Th>
                    <Th>User</Th>
                    <Th>Scan Source</Th>
                    <Th>AI Source</Th>
                    <Th>Status</Th>
                    <Th>Skin Summary</Th>
                    <Th>Recommendations</Th>
                    <Th>Created</Th>
                    <Th>Updated</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-border last:border-b-0 hover:bg-muted/60">
                      <Td><input type="checkbox" aria-label={`Select ${report.shortId}`} /></Td>
                      <Td>
                        <Link href={`/api/reports/${report.id}/print`} className="font-medium text-primary hover:underline">
                          {report.shortId}
                        </Link>
                      </Td>
                      <Td><UserCell report={report} /></Td>
                      <Td><Badge label={formatValue(report.scanSource)} tone="neutral" /></Td>
                      <Td><Badge label={formatValue(report.aiSource)} tone={report.aiSource === "gemini" ? "primary" : "neutral"} /></Td>
                      <Td><Badge label={formatValue(report.status)} tone={report.status === "failed" ? "danger" : "primary"} /></Td>
                      <Td>
                        <p className="max-w-72 truncate text-muted-foreground">{report.summary}</p>
                      </Td>
                      <Td>
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
                      </Td>
                      <Td><DateCell value={report.createdAt} /></Td>
                      <Td><DateCell value={report.updatedAt} /></Td>
                      <Td><ActionsMenu reportId={report.id} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {reports.map((report) => (
                <article key={report.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/api/reports/${report.id}/print`} className="font-medium text-primary">
                        {report.shortId}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                    </div>
                    <input type="checkbox" aria-label={`Select ${report.shortId}`} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge label={formatValue(report.scanSource)} tone="neutral" />
                    <Badge label={formatValue(report.aiSource)} tone={report.aiSource === "gemini" ? "primary" : "neutral"} />
                    <Badge label={formatValue(report.status)} tone={report.status === "failed" ? "danger" : "primary"} />
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
      </section>

      <footer className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          Showing {start}-{end} of {pagination.total} reports · Last Updated {formatDate(result.lastUpdated)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PageSizeLinks query={query} />
          <PaginationLink query={query} page={pagination.page - 1} disabled={pagination.page <= 1}>
            <IconChevronLeft className="size-4" />
            Previous
          </PaginationLink>
          <span className="rounded-md border border-border bg-muted px-3 py-2 text-xs">
            {pagination.page}
          </span>
          <PaginationLink query={query} page={pagination.page + 1} disabled={pagination.page >= pagination.pageCount}>
            Next
            <IconChevronRight className="size-4" />
          </PaginationLink>
        </div>
      </footer>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3 font-medium">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="align-middle px-3 py-3">{children}</td>
}

type ReportRow = Awaited<ReturnType<typeof listReportsPage>>["reports"][number]

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

function Badge({ label, tone }: { label: string; tone: "primary" | "neutral" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        tone === "primary" && "border-border bg-primary text-primary-foreground",
        tone === "neutral" && "border-border bg-muted text-muted-foreground",
        tone === "danger" && "border-destructive bg-background text-destructive",
      )}
    >
      {label}
    </span>
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
        <MenuLink href={`/api/reports/${reportId}/print`} label="View Report" />
        <MenuLink href={`/api/reports/${reportId}/print`} label="Print" />
        <MenuLink href={`/api/reports/${reportId}/download`} label="Download PDF" />
        <MenuLink href={`/api/reports/${reportId}`} label="View Recommendations" />
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
    <button disabled className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
      {Icon ? <Icon className="size-4" /> : null}
      {label}
    </button>
  )
}

function PaginationLink({
  query,
  page,
  disabled,
  children,
}: {
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
      href={`/reports?${getQueryString({ ...query, page })}`}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  )
}

function PageSizeLinks({ query }: { query: ReportTableQuery }) {
  return (
    <div className="flex items-center gap-1">
      {pageSizeOptions.map((pageSize) => (
        <Link
          key={pageSize}
          href={`/reports?${getQueryString({ ...query, page: 1, pageSize })}`}
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

function parseReportQuery(params: Record<string, string | string[] | undefined>): ReportTableQuery {
  return {
    page: parsePositiveInteger(getParam(params.page), 1),
    pageSize: parsePageSize(getParam(params.pageSize)),
    search: getOptionalString(getParam(params.search)),
    aiSource: getOneOf(getParam(params.aiSource), ["gemini", "fallback"] as const),
    status: getOneOf(getParam(params.status), ["completed", "pending", "failed", "archived"] as const),
    scanSource: getOneOf(getParam(params.scanSource), ["camera", "upload"] as const),
    dateRange: getOneOf(getParam(params.dateRange), ["today", "week", "month"] as const),
    sort: getOneOf(getParam(params.sort), ["newest", "oldest", "reportId", "status", "aiSource", "created", "updated"] as const) ?? "newest",
  }
}

function getQueryString(query: ReportTableQuery) {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.search) params.set("search", query.search)
  if (query.aiSource) params.set("aiSource", query.aiSource)
  if (query.status) params.set("status", query.status)
  if (query.scanSource) params.set("scanSource", query.scanSource)
  if (query.dateRange) params.set("dateRange", query.dateRange)
  if (query.sort) params.set("sort", query.sort)
  return params.toString()
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parsePageSize(value: string | undefined) {
  const parsed = parsePositiveInteger(value, 25)
  return parsed === 50 || parsed === 100 ? parsed : 25
}

function getOptionalString(value: string | undefined) {
  return value?.trim() || undefined
}

function getOneOf<const T extends readonly string[]>(value: string | undefined, allowed: T): T[number] | undefined {
  return value && allowed.includes(value) ? value : undefined
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
