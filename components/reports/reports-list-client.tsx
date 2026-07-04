"use client"

import { useState } from "react"
import {
  IconDownload,
  IconFileText,
  IconLoader2,
} from "@tabler/icons-react"

import { ScanDetailModal } from "@/components/reports/scan-detail-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { downloadReportPdf } from "@/lib/reports/download-report-pdf"
import { formatBand } from "@/lib/scan/format"
import type { SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

export type ReportListItem = {
  id: string
  createdAt: string
  status: string
  captureMode: string
  locationSnapshot: unknown
  creditsCharged: number | null
  usage: {
    modelId: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    latencyMs: number | null
    estimatedCostMicros: number | null
  } | null
  result: {
    overallBand: string
    dimensions: unknown
    summary: string | null
    recommendations: unknown
    disclaimerVersion: string
  } | null
}

type ReportsListClientProps = {
  scans: ReportListItem[]
}

export function ReportsListClient({ scans }: ReportsListClientProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ReportListItem | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  function openReport(scan: ReportListItem) {
    if (!scan.result) return
    setSelected(scan)
    setOpen(true)
  }

  async function handleDownloadPdf(scanId: string) {
    setDownloadingId(scanId)
    await downloadReportPdf(scanId, {
      onFinish: () => setDownloadingId(null),
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {scans.map((scan) => {
          const isDownloading = downloadingId === scan.id

          return (
            <article
              key={scan.id}
              className={cn(
                "rounded-xl border border-border bg-card p-5 transition-colors",
                scan.result && "cursor-pointer hover:bg-muted/30",
              )}
              onClick={() => scan.result && openReport(scan)}
              onKeyDown={(event) => {
                if (
                  scan.result &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault()
                  openReport(scan)
                }
              }}
              role={scan.result ? "button" : undefined}
              tabIndex={scan.result ? 0 : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(scan.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-medium capitalize">
                      {scan.result?.overallBand
                        ? formatBand(
                            scan.result
                              .overallBand as SkinAssessment["overallBand"],
                          )
                        : scan.status}
                    </h2>
                    <Badge variant="secondary" className="font-normal capitalize">
                      {scan.captureMode}
                    </Badge>
                  </div>
                  {scan.result?.summary ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {scan.result.summary}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  {scan.creditsCharged != null ? (
                    <>
                      <p className="text-muted-foreground">Credits</p>
                      <p className="font-medium tabular-nums">
                        {scan.creditsCharged.toLocaleString()}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>

              {scan.usage ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {scan.usage.modelId}
                  {" · "}
                  {scan.usage.totalTokens.toLocaleString()} tokens
                </p>
              ) : null}

              {scan.result ? (
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => openReport(scan)}
                  >
                    <IconFileText className="size-3.5" />
                    View details
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={isDownloading}
                    onClick={() => handleDownloadPdf(scan.id)}
                  >
                    {isDownloading ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconDownload className="size-3.5" />
                    )}
                    {isDownloading ? "Generating…" : "Download PDF"}
                  </Button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      <ScanDetailModal scan={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
