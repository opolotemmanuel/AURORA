"use client"

import { useState } from "react"
import Link from "next/link"
import { IconDownload, IconFileText } from "@tabler/icons-react"

import { ScanReportModal } from "@/components/scan/scan-report-modal"
import { Button } from "@/components/ui/button"
import { fromScanResult } from "@/lib/scan/persist"
import type { SkinAssessment } from "@/lib/scan/types"
import { formatBand } from "@/lib/scan/format"

type ReportListItem = {
  id: string
  createdAt: string
  status: string
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
  const [selected, setSelected] = useState<{
    scanId: string
    assessment: SkinAssessment
  } | null>(null)

  function openReport(scan: ReportListItem) {
    if (!scan.result) return
    setSelected({
      scanId: scan.id,
      assessment: fromScanResult({
        overallBand: scan.result.overallBand as SkinAssessment["overallBand"],
        dimensions: scan.result.dimensions as Parameters<
          typeof fromScanResult
        >[0]["dimensions"],
        summary: scan.result.summary,
        recommendations: scan.result.recommendations as Parameters<
          typeof fromScanResult
        >[0]["recommendations"],
        disclaimerVersion: scan.result.disclaimerVersion,
      }),
    })
    setOpen(true)
  }

  return (
    <>
      <div className="grid gap-4">
        {scans.map((scan) => (
          <article
            key={scan.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(scan.createdAt).toLocaleDateString()}
                </p>
                <h2 className="mt-1 font-heading text-lg font-medium capitalize">
                  {scan.status}
                </h2>
                {scan.result?.summary ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {scan.result.summary}
                  </p>
                ) : null}
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Overall</p>
                <p className="font-medium">
                  {scan.result?.overallBand
                    ? formatBand(
                        scan.result.overallBand as SkinAssessment["overallBand"],
                      )
                    : "Pending"}
                </p>
              </div>
            </div>

            {scan.result ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => openReport(scan)}
                >
                  <IconFileText className="size-3.5" />
                  View report
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <a href={`/api/reports/${scan.id}/pdf`} download>
                    <IconDownload className="size-3.5" />
                    Download PDF
                  </a>
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {selected ? (
        <ScanReportModal
          open={open}
          onOpenChange={setOpen}
          assessment={selected.assessment}
          scanId={selected.scanId}
        />
      ) : null}
    </>
  )
}
