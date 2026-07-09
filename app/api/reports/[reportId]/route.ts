// SECURITY NOTE: no access check here either — see the same note in
// ../route.ts. Any caller who knows or guesses a reportId can fetch that
// report's full analysis and matched scan, no session required.
import { NextResponse } from "next/server"

import { findReport, findScan, saveAuditLog } from "@/lib/backend/report-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReportRouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(_: Request, context: ReportRouteContext) {
  const { reportId } = await context.params
  const report = await findReport(reportId)

  if (!report) {
    return NextResponse.json({ success: false, error: "Report not found." }, { status: 404 })
  }

  await saveAuditLog({
    action: "Viewed report detail",
    targetType: "report",
    targetId: report.id,
  })

  return NextResponse.json({
    success: true,
    report,
    scan: await findScan(report.scanId),
    reportDownloadUrl: `/api/reports/${report.id}/print`,
  })
}
