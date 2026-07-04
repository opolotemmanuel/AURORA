"use client"

import { useEffect, useState } from "react"
import { IconRefresh } from "@tabler/icons-react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { Button } from "@/components/ui/button"
import { runQualityGate } from "@/lib/scan/quality-gate"
import type { QualityCheckResult } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ScanQualityStepProps = {
  imageSrc: string
  onPass: () => void
  onRetake: () => void
}

export function ScanQualityStep({
  imageSrc,
  onPass,
  onRetake,
}: ScanQualityStepProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<QualityCheckResult | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      setLoading(true)
      try {
        const image = await loadImage(imageSrc)
        const quality = await runQualityGate(image)
        if (!cancelled) setResult(quality)
      } catch {
        if (!cancelled) {
          setResult({
            faceDetected: false,
            faceCount: 0,
            faceCentered: false,
            lightingScore: 0,
            lightingBand: "too_dark",
            isPlausibleSkin: false,
            issues: ["Could not analyze this image. Try another photo."],
            passed: false,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [imageSrc])

  return (
    <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-border bg-background p-3">
      <div className="px-1">
        <p className="font-heading text-sm font-semibold text-foreground">
          Checking photo quality
        </p>
        <p className="text-xs text-muted-foreground">
          We verify lighting and that this is a real face photo
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="Photo preview" className="aspect-[3/4] w-full object-cover" />
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatedBadge
          status={
            loading
              ? "loading"
              : result?.faceDetected
                ? "success"
                : "danger"
          }
          size="sm"
        >
          Face detected
        </AnimatedBadge>
        <AnimatedBadge
          status={
            loading
              ? "loading"
              : result?.lightingBand === "ok"
                ? "success"
                : "warning"
          }
          size="sm"
        >
          Lighting
        </AnimatedBadge>
        <AnimatedBadge
          status={
            loading
              ? "loading"
              : result?.isPlausibleSkin
                ? "success"
                : "warning"
          }
          size="sm"
        >
          Skin photo
        </AnimatedBadge>
      </div>

      {!loading && result && result.issues.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {result.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetake}
          className="rounded-full"
        >
          <IconRefresh className="size-3.5" />
          Retake
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={loading || !result?.passed}
          onClick={onPass}
          className={cn("ml-auto rounded-full")}
        >
          Analyze skin
        </Button>
      </div>
    </div>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}
