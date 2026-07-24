// The "Download PDF" action — renders the report to a real PDF via headless
// Chrome (see lib/reports/pdf/render-report-pdf.ts) instead of the old
// print-html document. Auth/ownership check added here (previously missing
// entirely) mirroring app/api/reports/[reportId]/route.ts's existing
// pattern: same 404 for "doesn't exist" and "exists but isn't yours," so a
// signed-in stranger can't use the response to confirm a guessed reportId.
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getAdminPrincipal } from "@/lib/auth/admin"
import { getSession } from "@/lib/auth/session"
import { findReport, saveAuditLog, saveReportDownload } from "@/lib/backend/report-store"
import { renderReportPdf } from "@/lib/reports/pdf/render-report-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReportDownloadRouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(request: Request, context: ReportDownloadRouteContext) {
  const session = await getSession()
  const { reportId } = await context.params
  const report = await findReport(reportId)

  if (!report || (report.userId !== session?.user.id && !(await getAdminPrincipal()))) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 })
  }

  const requestCookies = (await cookies()).getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))

  let pdf: Buffer
  try {
    pdf = await renderReportPdf({
      reportId: report.id,
      // The origin this request itself arrived on, not BETTER_AUTH_URL —
      // see the baseUrl comment in render-report-pdf.ts for why.
      baseUrl: new URL(request.url).origin,
      cookies: requestCookies,
    })
  } catch (error) {
    console.error(`[reports] PDF generation failed for report ${reportId}:`, error)
    return NextResponse.json(
      { error: "Couldn't generate the PDF right now. Please try again." },
      { status: 503 },
    )
  }

  await saveReportDownload({
    reportId,
    format: "pdf",
    userAgent: request.headers.get("user-agent") ?? undefined,
  })
  await saveAuditLog({
    action: "Downloaded PDF report",
    targetType: "download",
    targetId: reportId,
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Disposition": `attachment; filename="aurora-skinsense-${report.id}.pdf"`,
      "Content-Type": "application/pdf",
    },
  })
}
