"use client"

import { useEffect, useState } from "react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanAnalyzingOverlay } from "@/components/scan/scan-analyzing-overlay"
import { ScanStepFrame } from "@/components/scan/scan-step-frame"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toUserFacingScanError } from "@/lib/scan/errors"
import type {
  AnalysisToolCall,
  AnalyzeScanResult,
  ScanClimateContext,
  SkinAssessment,
} from "@/lib/scan/types"
import { cn } from "@/lib/utils"

const ANALYSIS_STEPS: Array<Pick<AnalysisToolCall, "id" | "name" | "label">> = [
  {
    id: "sync_climate",
    name: "sync_climate",
    label: "Checking local climate",
  },
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

const WAIT_DESCRIPTIONS = [
  "Please wait while we review your photo...",
  "Hang tight as we assess your skin profile...",
  "Just a moment while we tailor your recommendations...",
  "Almost there — putting your report together...",
] as const

type ScanAnalyzingViewProps = {
  imageSrc: string
  imageBlob: Blob
  livePayload?: {
    transcript: string
    sessionDurationMs: number
  }
  onComplete: (result: {
    assessment: SkinAssessment
    scanId: string
    creditsCharged: number
    climateContext: ScanClimateContext | null
  }) => void
}

export function ScanAnalyzingView({
  imageSrc,
  imageBlob,
  livePayload,
  onComplete,
}: ScanAnalyzingViewProps) {
  const [toolCalls, setToolCalls] = useState<AnalysisToolCall[]>(() =>
    ANALYSIS_STEPS.map((step) => ({ ...step, status: "pending" as const })),
  )
  const [activeLabel, setActiveLabel] = useState("Preparing analysis")
  const [waitDescriptionIndex, setWaitDescriptionIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (error || isComplete) return

    const intervalId = window.setInterval(() => {
      setWaitDescriptionIndex((current) => (current + 1) % WAIT_DESCRIPTIONS.length)
    }, 3200)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [error, isComplete])

  const description = error
    ? "Something went wrong — see details below."
    : isComplete
      ? "Your personalized report is ready."
      : WAIT_DESCRIPTIONS[waitDescriptionIndex]

  useEffect(() => {
    let cancelled = false
    let stepIndex = 0

    const syncStepVisuals = () => {
      const step = ANALYSIS_STEPS[stepIndex]
      if (!step) return

      setActiveLabel(step.label)
      setToolCalls((current) =>
        current.map((entry, index) => ({
          ...entry,
          status:
            index < stepIndex
              ? "done"
              : index === stepIndex
                ? "running"
                : "pending",
          detail: index < stepIndex ? "Complete" : undefined,
        })),
      )
    }

    const advanceStep = () => {
      if (cancelled) return
      syncStepVisuals()
      if (stepIndex < ANALYSIS_STEPS.length - 1) {
        window.setTimeout(() => {
          if (cancelled) return
          stepIndex += 1
          advanceStep()
        }, 900)
      }
    }

    async function run() {
      advanceStep()

      try {
        const mimeType = imageBlob.type.startsWith("image/")
          ? imageBlob.type
          : "image/jpeg"

        const formData = new FormData()
        formData.append("image", imageBlob, "scan.jpg")
        formData.append("mimeType", mimeType)

        if (livePayload) {
          formData.append("transcript", livePayload.transcript)
          formData.append(
            "sessionDurationMs",
            String(livePayload.sessionDurationMs),
          )
        }

        const endpoint = livePayload
          ? "/api/scan/live/complete"
          : "/api/scan/analyze"

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        })

        const result = (await response.json()) as AnalyzeScanResult
        if (cancelled) return

        if (!response.ok || !result.ok) {
          const message = result.ok
            ? toUserFacingScanError(new Error("Skin analysis failed"))
            : result.error
          setError(message)
          setActiveLabel("Analysis failed")
          setToolCalls((current) =>
            current.map((entry) =>
              entry.status === "running"
                ? { ...entry, status: "error", detail: "Failed" }
                : entry,
            ),
          )
          return
        }

        setIsComplete(true)
        setActiveLabel("Analysis complete")
        setToolCalls((current) =>
          current.map((entry) => ({ ...entry, status: "done", detail: "Complete" })),
        )
        onComplete({
          assessment: result.assessment,
          scanId: result.scanId,
          creditsCharged: result.creditsCharged,
          climateContext: result.climateContext,
        })
      } catch {
        if (!cancelled) {
          setError(toUserFacingScanError(new Error("Skin analysis failed")))
          setActiveLabel("Analysis failed")
          setToolCalls((current) =>
            current.map((entry) =>
              entry.status === "running"
                ? { ...entry, status: "error", detail: "Failed" }
                : entry,
            ),
          )
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [imageBlob, livePayload, onComplete])

  const activePhase = toolCalls.findIndex((call) => call.status === "running")

  return (
    <ScanStepFrame>
      <ScanStepShell
        title="Analyzing your scan"
        description={description}
      >
      <Alert>
        <AlertDescription>
          {livePayload
            ? "Your live session is finalized in memory and is not stored or included in saved reports."
            : "Your photo is analyzed in memory and is not stored or included in saved reports."}
        </AlertDescription>
      </Alert>

      <div className="relative mx-auto overflow-hidden rounded-[1.5rem] border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Scan photo"
          className="mx-auto aspect-[3/4] h-[min(48svh,20rem)] w-auto max-w-full object-cover"
        />
        {!error && !isComplete ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/45 backdrop-blur-[1px]">
            <ScanAnalyzingOverlay activePhase={Math.max(activePhase, 0)} />
            <AnimatedBadge
              status="loading"
              size="md"
              aria-live="polite"
            >
              {activeLabel}
            </AnimatedBadge>
          </div>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>We couldn&apos;t finish your scan</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      <ul className="space-y-2">
        {toolCalls.map((call) => (
          <li
            key={call.id}
            className={cn(
              "flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm",
              call.status === "running" && "bg-muted/50",
              call.status === "error" && "border-destructive/40 bg-destructive/5",
            )}
          >
            <span className="text-foreground">{call.label}</span>
            <AnimatedBadge
              status={
                call.status === "done"
                  ? "success"
                  :                 call.status === "error"
                    ? "danger"
                    : call.status === "running"
                      ? "loading"
                      : "neutral"
              }
              size="sm"
              showIcon
            >
              {call.status === "done"
                ? "Done"
                : call.status === "error"
                  ? "Failed"
                  : call.status === "running"
                    ? "Running"
                    : "Queued"}
            </AnimatedBadge>
          </li>
        ))}
      </ul>
    </ScanStepShell>
    </ScanStepFrame>
  )
}
