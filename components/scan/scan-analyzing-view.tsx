"use client"

import { useEffect, useState } from "react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanReportLayout } from "@/components/scan/scan-report-layout"
import {
  createInitialToolCalls,
  simulateSkinAnalysis,
} from "@/lib/scan/simulate-analysis"
import type { AnalysisToolCall, SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ScanAnalyzingViewProps = {
  imageSrc: string
  imageBlob: Blob
  onComplete: (assessment: SkinAssessment) => void
}

export function ScanAnalyzingView({
  imageSrc,
  imageBlob,
  onComplete,
}: ScanAnalyzingViewProps) {
  const [toolCalls, setToolCalls] = useState<AnalysisToolCall[]>(
    createInitialToolCalls,
  )
  const [activeLabel, setActiveLabel] = useState("Preparing analysis")

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const assessment = await simulateSkinAnalysis(
          imageBlob,
          (call) => {
            if (cancelled) return
            setActiveLabel(call.label)
            setToolCalls((current) =>
              current.map((entry) =>
                entry.id === call.id ? { ...entry, ...call } : entry,
              ),
            )
          },
        )
        if (!cancelled) onComplete(assessment)
      } catch {
        if (!cancelled) {
          setActiveLabel("Analysis failed")
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [imageBlob, onComplete])

  return (
    <ScanReportLayout
      imageSrc={imageSrc}
      imageLoading
      imageLoadingLabel={activeLabel}
      showActions={false}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="font-heading text-lg font-semibold text-foreground">
            Analyzing your scan
          </p>
          <p className="text-xs text-muted-foreground">
            Cosmetic assessment only — not a medical diagnosis
          </p>
        </div>

        <ul className="space-y-2">
          {toolCalls.map((call) => (
            <li
              key={call.id}
              className={cn(
                "flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm",
                call.status === "running" && "bg-muted/50",
              )}
            >
              <span className="text-foreground">{call.label}</span>
              <AnimatedBadge
                status={
                  call.status === "done"
                    ? "success"
                    : call.status === "running"
                      ? "loading"
                      : "neutral"
                }
                size="sm"
                showIcon
              >
                {call.status === "done"
                  ? "Done"
                  : call.status === "running"
                    ? "Running"
                    : "Queued"}
              </AnimatedBadge>
            </li>
          ))}
        </ul>
      </div>
    </ScanReportLayout>
  )
}
