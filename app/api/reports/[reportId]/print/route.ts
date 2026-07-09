// Renders the full printable HTML report inline (viewed in-browser, e.g.
// from the dashboard's "View Report"/"Print" links). See download/route.ts
// for the near-identical attachment-download variant.
//
// SECURITY NOTE: no access check — same gap as ../route.ts and ../../route.ts.
import { findReport, saveAuditLog, saveReportDownload } from "@/lib/backend/report-store"
import { renderPrintableReport } from "@/lib/backend/printable-report"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReportPrintRouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(request: Request, context: ReportPrintRouteContext) {
  const { reportId } = await context.params
  const report = await findReport(reportId)

  if (!report) {
    return new Response("Report not found.", { status: 404 })
  }

  await saveReportDownload({
    reportId,
    format: "print-html",
    userAgent: request.headers.get("user-agent") ?? undefined,
  })
  await saveAuditLog({
    action: "Opened printable report",
    targetType: "report",
    targetId: reportId,
  })

  return new Response(renderPrintableReport(report), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
