import { findReport, saveAuditLog, saveReportDownload } from "@/lib/backend/report-store"
import { renderPrintableReport } from "@/lib/backend/printable-report"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReportDownloadRouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(request: Request, context: ReportDownloadRouteContext) {
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
    action: "Downloaded printable report",
    targetType: "download",
    targetId: reportId,
  })

  return new Response(renderPrintableReport(report), {
    headers: {
      "Content-Disposition": `attachment; filename="aurora-skinsense-${report.id}.html"`,
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
