"use client"

import { useEffect, useState } from "react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { analyzeScanAction } from "@/lib/scan/analyze-action"
import { blobToBase64 } from "@/lib/scan/image-bytes"
import type { AnalysisToolCall, SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

const ANALYSIS_STEPS: Array<Pick<AnalysisToolCall, "id" | "name" | "label">> = [
  { id: "locate_face", name: "locate_face", label: "Locating facial regions" },
  {
    id: "assess_texture",
    name: "assess_texture_bands",
    label: "Assessing texture bands",
  },
  {
    id: "match_products",
    name: "match_products",
    label: "Matching Aurora recommendations",
  },
]

type ScanAnalyzingViewProps = {
  imageSrc: string
  imageBlob: Blob
  onComplete: (result: {
    assessment: SkinAssessment
    scanId: string
    creditsCharged: number
  }) => void
}

export function ScanAnalyzingView({
  imageSrc,
  imageBlob,
  onComplete,
}: ScanAnalyzingViewProps) {
  const [toolCalls, setToolCalls] = useState<AnalysisToolCall[]>(() =>
    ANALYSIS_STEPS.map((step) => ({ ...step, status: "pending" as const })),
  )
  const [activeLabel, setActiveLabel] = useState("Preparing analysis")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let stepIndex = 0

    const advanceStep = () => {
      if (cancelled || stepIndex >= ANALYSIS_STEPS.length) return
      const step = ANALYSIS_STEPS[stepIndex]
      if (!step) return

      setActiveLabel(step.label)
      setToolCalls((current) =>
        current.map((entry) =>
          entry.id === step.id
            ? { ...entry, status: "running" }
            : entry,
        ),
      )

      window.setTimeout(() => {
        if (cancelled) return
        setToolCalls((current) =>
          current.map((entry) =>
            entry.id === step.id
              ? { ...entry, status: "done", detail: "Complete" }
              : entry,
          ),
        )
        stepIndex += 1
        advanceStep()
      }, 900)
    }

    async function run() {
      advanceStep()

      try {
        const imageBase64 = await blobToBase64(imageBlob)
        const mimeType = imageBlob.type.startsWith("image/")
          ? (imageBlob.type as "image/jpeg" | "image/png" | "image/webp")
          : "image/jpeg"

        const result = await analyzeScanAction({ imageBase64, imageMimeType: mimeType })
        if (cancelled) return

        if (!result.ok) {
          setError(result.error)
          setActiveLabel("Analysis failed")
          return
        }

        setActiveLabel("Analysis complete")
        setToolCalls((current) =>
          current.map((entry) => ({ ...entry, status: "done", detail: "Complete" })),
        )
        onComplete({
          assessment: result.assessment,
          scanId: result.scanId,
          creditsCharged: result.creditsCharged,
        })
      } catch {
        if (!cancelled) {
          setError("Analysis failed. Please try again.")
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
      <Alert>
        <AlertDescription>
          Your photo is analyzed in memory and is not stored or included in saved
          reports.
        </AlertDescription>
      </Alert>

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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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
