"use client"

import Link from "next/link"
import { IconDownload } from "@tabler/icons-react"

import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import { SkinReportContent } from "@/components/scan/skin-report-content"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"

type ScanReportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: SkinAssessment
  climateContext?: ScanClimateContext | null
  imageSrc?: string | null
  scanId?: string | null
}

export function ScanReportModal({
  open,
  onOpenChange,
  assessment,
  climateContext = null,
  imageSrc,
  scanId,
}: ScanReportModalProps) {
  const pdfHref = scanId ? `/api/reports/${scanId}/pdf` : null

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Your skin report"
      description="Cosmetic assessment — not a medical diagnosis"
      className="sm:max-w-5xl"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <ScanReportLayout
            imageSrc={imageSrc}
            showActions={false}
          >
            <SkinReportContent
              assessment={assessment}
              climateContext={climateContext}
            />
          </ScanReportLayout>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">
          {pdfHref ? (
            <Button asChild size="sm" className="rounded-full">
              <a href={pdfHref} download>
                <IconDownload className="size-3.5" />
                Download PDF
              </a>
            </Button>
          ) : (
            <Button size="sm" className="rounded-full" disabled>
              <IconDownload className="size-3.5" />
              Download PDF
            </Button>
          )}
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
