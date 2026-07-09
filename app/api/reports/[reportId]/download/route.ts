// Same as ../print/route.ts but forces a file download (Content-Disposition:
// attachment) instead of an inline view — both currently serve the same
// print-html format; despite the filename saying ".html" not ".pdf", this
// is the "Download PDF" action in the UI (DownloadFormat.PDF vs
// print-html distinction exists in the type system but real PDF generation
// isn't implemented yet — see AGENTS.md's Planned Stack: React-PDF).
//
// SECURITY NOTE: no access check — same gap as ../route.ts and ../../route.ts.
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
