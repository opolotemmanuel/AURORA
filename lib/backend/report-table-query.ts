// URL query-string parsing/serialization for the reports table, shared by
// app/(dashboard)/reports/page.tsx (own reports) and
// app/(dashboard)/admin/scans/page.tsx (every user's reports) — both pages
// render the same components/report/reports-table.tsx with a different
// ReportTableQuery.userId scoping decision made by the caller.
import type { ReportTableQuery } from "@/lib/backend/report-store"

export const REPORT_TABLE_PAGE_SIZE_OPTIONS = [25, 50, 100] as const

export const REPORT_TABLE_SORT_OPTIONS: Array<{ value: NonNullable<ReportTableQuery["sort"]>; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "reportId", label: "Report ID" },
  { value: "status", label: "Status" },
  { value: "aiSource", label: "AI Source" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
]

export function parseReportQuery(params: Record<string, string | string[] | undefined>): ReportTableQuery {
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

export function getQueryString(query: ReportTableQuery) {
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
