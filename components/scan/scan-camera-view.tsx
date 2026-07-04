"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react"
import {
  IconArrowLeft,
  IconCameraRotate,
  IconCircle,
  IconGripHorizontal,
  IconSun,
  IconUser,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "motion/react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import {
  SCAN_CAMERA_HEIGHT,
  useScanCameraHeight,
} from "@/hooks/use-scan-camera-height"
import { runQualityGate } from "@/lib/scan/quality-gate"
import type { QualityCheckResult } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ScanCameraViewProps = {
  fullscreen?: boolean
  onCapture: (file: File, previewUrl: string) => void
  onSwitchToUpload?: () => void
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return isMobile
}

const INITIAL_QUALITY: QualityCheckResult = {
  faceDetected: false,
  faceCount: 0,
  faceCentered: false,
  lightingScore: 0,
  lightingBand: "too_dark",
  isPlausibleSkin: false,
  issues: [],
  passed: false,
}

export function ScanCameraView({
  fullscreen,
  onCapture,
  onSwitchToUpload,
}: ScanCameraViewProps) {
  const isMobile = useIsMobile()
  const isFullscreen = fullscreen ?? isMobile
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const checkingRef = useRef(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quality, setQuality] = useState<QualityCheckResult>(INITIAL_QUALITY)
  const [capturing, setCapturing] = useState(false)
  const { height: embeddedHeight, setHeight: setEmbeddedHeight } =
    useScanCameraHeight()
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  )

  const stopResize = useCallback(() => {
    resizeStateRef.current = null
  }, [])

  const handleResizePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (isFullscreen) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      resizeStateRef.current = {
        startY: event.clientY,
        startHeight: embeddedHeight,
      }
    },
    [embeddedHeight, isFullscreen],
  )

  const handleResizePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const state = resizeStateRef.current
      if (!state) return
      const delta = event.clientY - state.startY
      setEmbeddedHeight(state.startHeight + delta)
    },
    [setEmbeddedHeight],
  )

  const handleResizePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!resizeStateRef.current) return
      event.currentTarget.releasePointerCapture(event.pointerId)
      stopResize()
    },
    [stopResize],
  )

  const handleResizeDoubleClick = useCallback(() => {
    setEmbeddedHeight(SCAN_CAMERA_HEIGHT.default)
  }, [setEmbeddedHeight])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      setReady(false)
      setError(null)
      stopStream()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
          setReady(true)
        }
      } catch {
        setError("Camera access is required for live capture.")
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [facingMode, stopStream])

  useEffect(() => {
    if (!ready) return

    let frame = 0

    const interval = window.setInterval(async () => {
      const video = videoRef.current
      if (!video || video.videoWidth === 0 || checkingRef.current) return

      checkingRef.current = true
      frame += 1
      try {
        const result = await runQualityGate(video, frame)
        setQuality(result)
      } catch {
        // ignore transient detection errors during live preview
      } finally {
        checkingRef.current = false
      }
    }, 280)

    return () => window.clearInterval(interval)
  }, [ready])

  // Live preview: face + lighting only; full gate runs again after capture.
  const canCapture =
    ready &&
    !capturing &&
    quality.faceDetected &&
    quality.faceCount === 1 &&
    quality.lightingBand === "ok"

  const handleCapture = async () => {
    const video = videoRef.current
    if (!video || !canCapture) return

    setCapturing(true)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (facingMode === "user") {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      })
      if (!blob) return

      const file = new File([blob], `scan-${Date.now()}.jpg`, {
        type: "image/jpeg",
      })
      const previewUrl = URL.createObjectURL(file)
      stopStream()
      onCapture(file, previewUrl)
    } finally {
      setCapturing(false)
    }
  }

  const lightingOk = quality.lightingBand === "ok"

  const cameraViewport = (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-background",
        isFullscreen
          ? "fixed inset-0 z-50"
          : "w-full rounded-[1.75rem] border border-border",
      )}
      style={isFullscreen ? undefined : { height: embeddedHeight }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className={cn(
          "size-full object-cover",
          facingMode === "user" && "scale-x-[-1]",
        )}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/80" />

      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4",
          isFullscreen ? "pt-[max(1rem,env(safe-area-inset-top))]" : "p-3",
        )}
      >
        {isFullscreen ? (
          onSwitchToUpload ? (
            <button
              type="button"
              onClick={onSwitchToUpload}
              aria-label="Back to upload"
              className="pointer-events-auto grid size-10 place-items-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm active:scale-95"
            >
              <IconArrowLeft className="size-4" />
            </button>
          ) : (
            <ScanDashboardLink variant="icon" />
          )
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={() =>
            setFacingMode((current) =>
              current === "user" ? "environment" : "user",
            )
          }
          aria-label="Switch camera"
          className="pointer-events-auto grid size-10 place-items-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm active:scale-95"
        >
          <IconCameraRotate className="size-5" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0 bg-background/35 mask-[radial-gradient(ellipse_36%_43%_at_50%_50%,transparent_98%,black_100%)]"
        />
        <div className="relative h-[62%] w-[72%] rounded-[50%] border-2 border-primary/70" />
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 space-y-4 p-4",
          isFullscreen ? "pb-[max(1rem,env(safe-area-inset-bottom))]" : "p-3",
        )}
      >
        <div className="flex flex-wrap justify-center gap-2">
          <AnimatedBadge
            status={quality.faceDetected ? "success" : "warning"}
            size="sm"
            icon={<IconUser className="size-3" />}
          >
            {quality.faceDetected ? "Face detected" : "Find your face"}
          </AnimatedBadge>
          <AnimatedBadge
            status={lightingOk ? "success" : "warning"}
            size="sm"
            icon={<IconSun className="size-3" />}
          >
            {lightingOk ? "Lighting OK" : "Adjust lighting"}
          </AnimatedBadge>
        </div>

        {error ? (
          <p className="pointer-events-none text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!canCapture && ready && !error && quality.issues[0] ? (
          <p className="pointer-events-none text-center text-xs text-muted-foreground">
            {quality.issues[0]}
          </p>
        ) : null}

        <div className="flex items-center justify-center">
          <button
            type="button"
            disabled={!canCapture}
            onClick={() => void handleCapture()}
            aria-label="Take photo"
            className={cn(
              "pointer-events-auto grid size-16 place-items-center rounded-full border-4 border-primary bg-background/90 transition-transform active:scale-95 disabled:opacity-45",
              canCapture ? "cursor-pointer" : "cursor-not-allowed",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={canCapture ? "ready" : "wait"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <IconCircle className="size-8 text-primary" />
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  )

  if (isFullscreen) {
    return cameraViewport
  }

  return (
    <div className="w-full">
      {cameraViewport}
      <button
        type="button"
        aria-label="Resize camera preview. Double-click to reset."
        title="Drag to resize. Double-click to reset."
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        onDoubleClick={handleResizeDoubleClick}
        className="mt-1.5 flex w-full cursor-ns-resize touch-none items-center justify-center rounded-lg py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <IconGripHorizontal className="size-4" aria-hidden />
      </button>
    </div>
  )
}
