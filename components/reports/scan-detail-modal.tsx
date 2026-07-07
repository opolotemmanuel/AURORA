"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconDownload,
  IconLoader2,
  IconTrash,
} from "@tabler/icons-react"

import { ReportDocumentHeader } from "@/components/reports/report-document-header"
import { SkinReportDocument } from "@/components/reports/skin-report-document"
import { ScanFeedbackWidget } from "@/components/scan/scan-feedback-widget"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { parseLocationSnapshot } from "@/lib/climate/snapshot"
import { downloadReportPdf } from "@/lib/reports/download-report-pdf"
import { fromScanResult } from "@/lib/scan/persist"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { deleteScanAction } from "@/lib/user/data-actions"
import { cn } from "@/lib/utils"

import type { ReportListItem } from "./reports-list-client"

type ScanDetailModalProps = {
  scan: ReportListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScanDetailModal({
  scan,
  open,
  onOpenChange,
}: ScanDetailModalProps) {
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!scan?.result) return null

  const assessment: SkinAssessment = fromScanResult({
    overallBand: scan.result.overallBand as SkinAssessment["overallBand"],
    dimensions: scan.result.dimensions as Parameters<
      typeof fromScanResult
    >[0]["dimensions"],
    doshaTyping: scan.result.doshaTyping as Parameters<
      typeof fromScanResult
    >[0]["doshaTyping"],
    summary: scan.result.summary,
    naturalRecommendations: scan.result.naturalRecommendations as Parameters<
      typeof fromScanResult
    >[0]["naturalRecommendations"],
    recommendations: scan.result.recommendations as Parameters<
      typeof fromScanResult
    >[0]["recommendations"],
    disclaimerVersion: scan.result.disclaimerVersion,
  })

  const climateContext: ScanClimateContext | null = parseLocationSnapshot(
    scan.locationSnapshot,
  )

  const scanDate = new Date(scan.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  async function handleDownloadPdf() {
    setDownloading(true)
    await downloadReportPdf(scan!.id, {
      onFinish: () => setDownloading(false),
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteScanAction(scan!.id)
      setDeleteOpen(false)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Skin report"
        description={scanDate}
        className="sm:max-w-5xl"
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-20 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
              <ReportDocumentHeader
                scanDate={scanDate}
                captureMode={scan.captureMode}
                usage={scan.usage}
              />

              <SkinReportDocument
                assessment={assessment}
                climateContext={climateContext}
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-14 z-30 flex justify-end px-4 sm:bottom-16 sm:px-6">
            <ScanFeedbackWidget
              scanId={scan.id}
              existingFeedback={scan.feedback}
              position="bottom-right"
              anchored
              className="pointer-events-auto"
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-3.5" />
              Delete scan
            </Button>
            <Button
              type="button"
              size="sm"
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the scan result, usage record, and report metadata.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? "Deleting…" : "Delete scan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
