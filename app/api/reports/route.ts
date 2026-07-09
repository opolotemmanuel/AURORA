// JSON API mirror of the server-rendered reports table
// (app/(dashboard)/reports/page.tsx) — same query params, same
// listReportsPage call, same ownership scoping.
import { NextResponse } from "next/server"

import {
  listReportsPage,
  type ReportTableQuery,
  type ReportTableSort,
  type ReportTableStatus,
} from "@/lib/backend/report-store"
import { getAdminPrincipal } from "@/lib/auth/admin"
import { getSession } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const aiSources = ["gemini", "fallback"] as const
const statuses = ["completed", "pending", "failed", "archived"] as const
const scanSources = ["camera", "upload"] as const
const dateRanges = ["today", "week", "month"] as const
const sorts = ["newest", "oldest", "reportId", "status", "aiSource", "created", "updated"] as const

export async function GET(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = parseReportQuery(url.searchParams)
  const isAdminTier = Boolean(await getAdminPrincipal())
  const scopedQuery = isAdminTier ? query : { ...query, userId: session.user.id }
  const result = await listReportsPage(scopedQuery)

  return NextResponse.json({
    success: true,
    ...result,
  })
}

function parseReportQuery(searchParams: URLSearchParams): ReportTableQuery {
  return {
    page: parsePositiveInteger(searchParams.get("page"), 1),
    pageSize: parsePageSize(searchParams.get("pageSize")),
    search: getOptionalString(searchParams.get("search")),
    aiSource: getOneOf(searchParams.get("aiSource"), aiSources),
    status: getOneOf(searchParams.get("status"), statuses) as ReportTableStatus | undefined,
    scanSource: getOneOf(searchParams.get("scanSource"), scanSources),
    dateRange: getOneOf(searchParams.get("dateRange"), dateRanges),
    sort: getOneOf(searchParams.get("sort"), sorts) as ReportTableSort | undefined,
  }
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parsePageSize(value: string | null) {
  const parsed = parsePositiveInteger(value, 25)
  return parsed === 50 || parsed === 100 ? parsed : 25
}

function getOptionalString(value: string | null) {
  return value?.trim() || undefined
}

function getOneOf<const T extends readonly string[]>(value: string | null, allowed: T): T[number] | undefined {
  return value && allowed.includes(value) ? value : undefined
}
