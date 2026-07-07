"use client"

import { useEffect, useState } from "react"
import { IconCrop, IconRefresh } from "@tabler/icons-react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanStepFrame } from "@/components/scan/scan-step-frame"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { Button } from "@/components/ui/button"
import { runQualityGate } from "@/lib/scan/quality-gate"
import type { QualityCheckResult } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ScanQualityStepProps = {
  imageSrc: string
  onPass: () => void
  onReEdit: () => void
  onRetake: () => void
}

export function ScanQualityStep({
  imageSrc,
  onPass,
  onReEdit,
  onRetake,
}: ScanQualityStepProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<QualityCheckResult | null>(null)
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      setLoading(true)
      try {
        const image = await loadImage(imageSrc)
        const shortEdge = Math.min(image.naturalWidth, image.naturalHeight)
        if (!cancelled) {
          setResolutionWarning(
            shortEdge < 1024
              ? `Photo resolution is ${image.naturalWidth}×${image.naturalHeight}. For best results, use a larger crop or a higher-resolution camera.`
              : null,
          )
        }
        const quality = await runQualityGate(image, { trustUserCrop: true })
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
            issues: [
              "Face detection failed for this photo. Try better lighting, a larger crop, or retake.",
            ],
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
    <ScanStepFrame>
      <ScanStepShell
        title="Checking photo quality"
        description="We verify lighting on your cropped skin photo"
      >
      <div className="mx-auto overflow-hidden rounded-[1.5rem] border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Photo preview"
          className="mx-auto aspect-[3/4] h-[min(48svh,20rem)] w-auto max-w-full object-cover"
        />
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
          Skin crop
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

      {!loading && (result?.issues.length || resolutionWarning) ? (
        <ul className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {resolutionWarning ? <li>{resolutionWarning}</li> : null}
          {result?.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReEdit}
          className="rounded-full"
        >
          <IconCrop className="size-3.5" />
          Adjust crop
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetake}
          className="rounded-full"
        >
          <IconRefresh className="size-3.5" />
          Retake photo
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
    </ScanStepShell>
    </ScanStepFrame>
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
