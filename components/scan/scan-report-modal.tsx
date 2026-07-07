"use client"

import Link from "next/link"
import { useState } from "react"
import { IconDownload, IconLoader2 } from "@tabler/icons-react"

import { ReportDocumentHeader } from "@/components/reports/report-document-header"
import { SkinReportDocument } from "@/components/reports/skin-report-document"
import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { downloadReportPdf } from "@/lib/reports/download-report-pdf"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"

type ScanReportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  imageSrc?: string | null
  scanId?: string | null
  creditsCharged?: number | null
  scanDate?: string
}

export function ScanReportModal({
  open,
  onOpenChange,
  assessment,
  climateContext = null,
  imageSrc,
  scanId,
  creditsCharged,
  scanDate,
}: ScanReportModalProps) {
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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Skin report"
      description={formattedDate}
      className="sm:max-w-5xl"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <ScanReportLayout imageSrc={imageSrc} showActions={false}>
            <div className="mx-auto max-w-3xl space-y-6">
              <ReportDocumentHeader
                scanDate={formattedDate}
                creditsCharged={creditsCharged}
              />
              <SkinReportDocument
                assessment={assessment}
                climateContext={climateContext}
              />
            </div>
          </ScanReportLayout>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={!scanId || downloading}
            onClick={handleDownloadPdf}
          >
            {downloading ? (
              <IconLoader2 className="size-3.5 animate-spin" />
            ) : (
              <IconDownload className="size-3.5" />
            )}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/reports">All reports</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
