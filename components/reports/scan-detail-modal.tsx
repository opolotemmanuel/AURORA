"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconDownload,
  IconLoader2,
  IconTrash,
} from "@tabler/icons-react"

import { ScanFeedbackWidget } from "@/components/scan/scan-feedback-widget"
import { SkinReportContent } from "@/components/scan/skin-report-content"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { formatMicroUsd } from "@/lib/scan/band-score"
import { parseLocationSnapshot } from "@/lib/climate/snapshot"
import { downloadReportPdf } from "@/lib/reports/download-report-pdf"
import { fromScanResult } from "@/lib/scan/persist"
import { formatBand } from "@/lib/scan/format"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { formatCreditUsdValue } from "@/lib/tokens/format"
import { deleteScanAction } from "@/lib/user/data-actions"
import { cn } from "@/lib/utils"

import type { ReportListItem } from "./reports-list-client"

type ScanDetailModalProps = {
  scan: ReportListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  )
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

  const creditsLabel =
    scan.creditsCharged != null
      ? `${scan.creditsCharged.toLocaleString()} credits`
      : "—"

  const costLabel =
    scan.creditsCharged != null
      ? formatCreditUsdValue(scan.creditsCharged)
      : "—"

  const providerCostLabel =
    scan.usage?.estimatedCostMicros != null
      ? formatMicroUsd(scan.usage.estimatedCostMicros)
      : "—"

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Scan details"
        description="Cosmetic assessment — not a medical diagnosis"
        className="sm:max-w-5xl"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 sm:max-w-md">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-sm font-medium">Scan stats</h3>
                <Badge variant="secondary" className="font-normal capitalize">
                  {scan.captureMode}
                </Badge>
              </div>
              <div className="space-y-2">
                <StatRow
                  label="Date"
                  value={new Date(scan.createdAt).toLocaleString()}
                />
                <StatRow
                  label="Overall band"
                  value={formatBand(
                    scan.result.overallBand as SkinAssessment["overallBand"],
                  )}
                />
                <StatRow label="Credits used" value={creditsLabel} />
                <StatRow label="Credit value" value={costLabel} />
                <StatRow label="Provider cost" value={providerCostLabel} />
                {scan.usage ? (
                  <>
                    <StatRow label="Model" value={scan.usage.modelId} />
                    <StatRow
                      label="Tokens"
                      value={`${scan.usage.inputTokens.toLocaleString()} in / ${scan.usage.outputTokens.toLocaleString()} out`}
                    />
                    <StatRow
                      label="Total tokens"
                      value={scan.usage.totalTokens.toLocaleString()}
                    />
                    {scan.usage.latencyMs != null ? (
                      <StatRow
                        label="Latency"
                        value={`${(scan.usage.latencyMs / 1000).toFixed(1)}s`}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <SkinReportContent
              assessment={assessment}
              climateContext={climateContext}
            />
            <ScanFeedbackWidget
              scanId={scan.id}
              existingFeedback={scan.feedback}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-3.5" />
              Delete scan
            </Button>
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
