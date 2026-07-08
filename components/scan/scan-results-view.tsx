"use client"

import { useState } from "react"
import { IconDownload, IconLoader2 } from "@tabler/icons-react"

import { ReportDocumentHeader } from "@/components/reports/report-document-header"
import { SkinReportDocument } from "@/components/reports/skin-report-document"
import { ScanReportChatDock } from "@/components/scan/scan-report-chat-dock"
import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { downloadReportPdf } from "@/lib/reports/download-report-pdf"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"

type ScanResultsViewProps = {
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  imageSrc: string
  scanId: string | null
  onNewScan: () => void
  onReEdit: () => void
  onViewReport: () => void
  scanDate?: string
}

export function ScanResultsView({
  assessment,
  climateContext = null,
  imageSrc,
  scanId,
  onNewScan,
  onReEdit,
  onViewReport,
  scanDate,
}: ScanResultsViewProps) {
  const [downloading, setDownloading] = useState(false)

  const formattedDate =
    scanDate ??
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  async function handleDownloadPdf() {
    if (!scanId) return
    setDownloading(true)
    await downloadReportPdf(scanId, {
      onFinish: () => setDownloading(false),
    })
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <ScanReportLayout
        imageSrc={imageSrc}
        onRescan={onNewScan}
        onReEdit={onReEdit}
        onViewReport={onViewReport}
      >
        <div className="mx-auto max-w-3xl space-y-6 pb-44">
          <ReportDocumentHeader scanDate={formattedDate} />

          <Alert>
            <AlertDescription>
              Your photo is shown only for this session. It is not stored or
              included in saved reports or PDFs.
            </AlertDescription>
          </Alert>

          <SkinReportDocument
            assessment={assessment}
            climateContext={climateContext}
          />

          {scanId ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={downloading}
                onClick={handleDownloadPdf}
              >
                {downloading ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : (
                  <IconDownload className="size-3.5" />
                )}
                {downloading ? "Generating…" : "Download PDF"}
              </Button>
            </div>
          ) : null}
        </div>
      </ScanReportLayout>

      {scanId ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4">
          <div className="mx-auto grid w-full max-w-5xl lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-8">
            <div className="hidden lg:block" aria-hidden />
            <div className="pointer-events-auto flex justify-end">
              <ScanReportChatDock scanId={scanId} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
