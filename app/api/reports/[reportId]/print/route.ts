// Redirects to the chrome-free print page (app/reports/[reportId]/print),
// which renders the same rich report sections as the dashboard detail page
// and performs its own ownership/admin check via loadReportViewModel — so
// this route no longer needs (or duplicates) an access check of its own.
// Replaces the old inline HTML-string response (see lib/backend/
// printable-report.ts, now unused) which had no access check at all.
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

type ReportPrintRouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(_request: Request, context: ReportPrintRouteContext) {
  const { reportId } = await context.params
  redirect(`/reports/${reportId}/print`)
}
