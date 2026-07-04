"use client"

import { useEffect, useState } from "react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
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
    <ScanStepShell
      title="Analyzing your scan"
      description="Cosmetic assessment only — not a medical diagnosis"
    >
      <div className="relative mx-auto overflow-hidden rounded-[1.5rem] border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Scan photo"
          className="mx-auto aspect-[3/4] h-[min(48svh,20rem)] w-auto max-w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px]">
          <AnimatedBadge status="loading" size="md" aria-live="polite">
            {activeLabel}
          </AnimatedBadge>
        </div>
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
    </ScanStepShell>
  )
}
