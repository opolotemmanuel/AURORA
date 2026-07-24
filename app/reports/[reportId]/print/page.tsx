// Chrome-free print/PDF surface — deliberately outside every route group
// (marketing/dashboard/etc.), so it only inherits the root layout (fonts,
// theme) and none of the dashboard sidebar. This is what
// lib/reports/pdf/render-report-pdf.ts navigates Playwright to: same
// section components and view-model as the dashboard page (see
// components/report/report-sections-list.tsx), just a bare A4-width wrapper
// instead of app chrome — "one visual source of truth" for both the web
// report and the PDF.
import { notFound } from "next/navigation"

import { ReportSectionsList } from "@/components/report/report-sections-list"
import { loadReportViewModel } from "@/lib/reports/load-report-view-model"

type PrintReportPageProps = {
  params: Promise<{ reportId: string }>
}

export default async function PrintReportPage({ params }: PrintReportPageProps) {
  const { reportId } = await params
  const vm = await loadReportViewModel(reportId)

  if (!vm) notFound()

  return (
    // report-print-surface: styling hook only — see the `@media print`
    // block in app/globals.css. Scoped to this class (not present on the
    // dashboard's on-screen /reports/[reportId] page, which renders the
    // same ReportSectionsList) so the editorial PDF restyle never leaks
    // into the interactive web report.
    <div className="report-print-surface mx-auto max-w-[210mm] space-y-6 bg-background p-8 print:space-y-4 print:p-0">
      <ReportSectionsList vm={vm} />
    </div>
  )
}
