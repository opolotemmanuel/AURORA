"use client"

import { useEffect, useState } from "react"
import { IconRefresh } from "@tabler/icons-react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanAnalysisProgressRow } from "@/components/scan/scan-analysis-progress-row"
import { ScanAnalyzingOverlay } from "@/components/scan/scan-analyzing-overlay"
import { ScanHeaderActionButton } from "@/components/scan/scan-header-action"
import { ScanStepFrame } from "@/components/scan/scan-step-frame"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toUserFacingScanError } from "@/lib/scan/errors"
import type {
  AnalyzeScanResult,
  ScanClimateContext,
  SkinAssessment,
} from "@/lib/scan/types"

const ANALYSIS_PHASE_LABELS = [
  "Checking local climate",
  "Locating facial regions",
  "Assessing texture bands",
  "Matching recommendations",
] as const

const PHASE_ADVANCE_MS = 900
const FINAL_PHASE_INDEX = ANALYSIS_PHASE_LABELS.length - 1

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
    climateContext: ScanClimateContext | null
  }) => void
  onRetry?: () => void
}

export function ScanAnalyzingView({
  imageSrc,
  imageBlob,
  livePayload,
  onComplete,
  onRetry,
}: ScanAnalyzingViewProps) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [waitDescriptionIndex, setWaitDescriptionIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const activeLabel = error
    ? "Analysis failed"
    : isComplete
      ? "Analysis complete"
      : ANALYSIS_PHASE_LABELS[Math.min(phaseIndex, FINAL_PHASE_INDEX)]

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

    const advancePhase = () => {
      if (cancelled) return

      setPhaseIndex(stepIndex)

      if (stepIndex < FINAL_PHASE_INDEX) {
        window.setTimeout(() => {
          if (cancelled) return
          stepIndex += 1
          advancePhase()
        }, PHASE_ADVANCE_MS)
      }
    }

    async function run() {
      advancePhase()

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
          return
        }

        setPhaseIndex(FINAL_PHASE_INDEX)
        setIsComplete(true)
        onComplete({
          assessment: result.assessment,
          scanId: result.scanId,
          climateContext: result.climateContext,
        })
      } catch {
        if (!cancelled) {
          setError(toUserFacingScanError(new Error("Skin analysis failed")))
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [imageBlob, livePayload, onComplete])

  return (
    <ScanStepFrame
      headerTrailing={
        error && onRetry ? (
          <>
            <ScanHeaderActionButton
              label="Retry"
              icon={<IconRefresh className="size-3.5" />}
              onClick={onRetry}
            />
          </>
        ) : undefined
      }
    >
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
            <ScanAnalyzingOverlay activePhase={phaseIndex} />
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

      {!error && !isComplete ? (
        <ScanAnalysisProgressRow label={activeLabel} />
      ) : null}
    </ScanStepShell>
    </ScanStepFrame>
  )
}
