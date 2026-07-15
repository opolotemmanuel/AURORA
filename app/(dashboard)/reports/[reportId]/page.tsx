// The "web report" (spec's Responsive Web Report). Authentication is
// already enforced by the parent (dashboard) layout's getSession() redirect;
// loadReportViewModel adds the ownership/admin authorization check (see its
// doc comment for why that's centralized there).
import { notFound } from "next/navigation"
import { IconDownload } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ReportChatPanel } from "@/components/report/report-chat-panel"
import { ReportSectionsList } from "@/components/report/report-sections-list"
import { loadReportViewModel } from "@/lib/reports/load-report-view-model"

type ReportPageProps = {
  params: Promise<{ reportId: string }>
}

export default async function ReportDetailPage({ params }: ReportPageProps) {
  const { reportId } = await params
  const vm = await loadReportViewModel(reportId)

  if (!vm) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Interactive-only chrome — deliberately not part of
          ReportSectionsList, which the chrome-free print/PDF page also
          renders, and a chat button has no business appearing in a PDF. */}
      {vm.chatEnabled ? (
        <div className="flex justify-end">
          <ReportChatPanel reportId={vm.reportId} />
        </div>
      ) : null}
      <ReportSectionsList vm={vm} />
      {/* Closing action, deliberately outside ReportSectionsList (same
          reason as the chat panel above — this is interactive-only chrome
          shared with nothing, and a "download this PDF" button has no
          business appearing inside the PDF it downloads). Plain <a>, not
          next/link's <Link>: this route streams a real PDF with
          Content-Disposition: attachment, and Link's client-side soft
          navigation (plus hover/viewport prefetch) would defeat that
          header entirely — the exact bug just fixed on the reports table,
          see components/report/reports-table.tsx. */}
      <div className="flex justify-center border-t border-border pt-8">
        <Button asChild variant="outline">
          <a href={`/api/reports/${vm.reportId}/download`}>
            <IconDownload className="size-4" />
            Download PDF Report
          </a>
        </Button>
      </div>
    </div>
  )
}
