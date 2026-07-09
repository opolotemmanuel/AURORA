import { NextResponse } from "next/server"

import { findReport, findScan, saveAuditLog } from "@/lib/backend/report-store"
import { getAdminPrincipal } from "@/lib/auth/admin"
import { getSession } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReportRouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(_: Request, context: ReportRouteContext) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
  }

  const { reportId } = await context.params
  const report = await findReport(reportId)

  // Same response for "doesn't exist" and "exists but isn't yours" — a 403
  // would confirm to a signed-in stranger that a guessed reportId is real.
  if (!report || (report.userId !== session.user.id && !(await getAdminPrincipal()))) {
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
