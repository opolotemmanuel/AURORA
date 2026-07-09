// The actual report content, shared verbatim between the dashboard-chrome'd
// page and the chrome-free print page Playwright renders to PDF — "one
// visual source of truth," per the PDF pipeline's design (see
// lib/reports/pdf/render-report-pdf.ts).
import { REPORT_SECTIONS } from "@/lib/reports/report-sections.config"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function ReportSectionsList({ vm }: { vm: ReportViewModel }) {
  return (
    <>
      {REPORT_SECTIONS.filter((section) => section.isEnabled(vm)).map((section) => (
        <section.component key={section.id} vm={vm} />
      ))}
    </>
  )
}
