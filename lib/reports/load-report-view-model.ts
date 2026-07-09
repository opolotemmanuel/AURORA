// Shared "find, authorize, assemble" step for every surface that renders a
// report (the dashboard detail page and the chrome-free print page Playwright
// targets for PDF generation — see app/(dashboard)/reports/[reportId]/page.tsx
// and app/reports/[reportId]/print/page.tsx) — one place decides who can see
// a report, instead of two copies of the same check drifting apart.
import { getAdminPrincipal } from "@/lib/auth/admin"
import { getSession } from "@/lib/auth/session"
import {
  findAiProviderEventForReport,
  findReport,
  findReportOwner,
  findScan,
  listReportsForUser,
  saveAuditLog,
} from "@/lib/backend/report-store"
import { buildReportViewModel, type ReportViewModel } from "@/lib/reports/report-view-model"

export async function loadReportViewModel(reportId: string): Promise<ReportViewModel | null> {
  const session = await getSession()
  const report = await findReport(reportId)

  if (!report || (report.userId !== session?.user.id && !(await getAdminPrincipal()))) {
    return null
  }

  const [scan, owner, aiEvent, priorReports] = await Promise.all([
    findScan(report.scanId),
    report.userId ? findReportOwner(report.userId) : null,
    findAiProviderEventForReport(report.id),
    report.userId ? listReportsForUser(report.userId) : Promise.resolve([]),
  ])

  if (!scan) return null

  await saveAuditLog({
    action: "Viewed report detail",
    targetType: "report",
    targetId: report.id,
  })

  return buildReportViewModel({
    report,
    scan,
    owner,
    aiEvent,
    priorReports: priorReports.filter((prior) => prior.id !== report.id),
  })
}
