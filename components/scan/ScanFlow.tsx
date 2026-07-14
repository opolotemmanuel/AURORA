"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  IconArrowsMove,
  IconCamera,
  IconCheck,
  IconChevronLeft,
  IconCrop,
  IconDownload,
  IconFlipHorizontal,
  IconInfoCircle,
  IconLoader2,
  IconMapPin,
  IconMessageCircle,
  IconPhotoScan,
  IconRefresh,
  IconReportAnalytics,
  IconRotate,
  IconRotateClockwise,
  IconShieldCheck,
  IconSparkles,
  IconTrash,
  IconUpload,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react"

// The entire scan flow as one client component: a linear four-step wizard
// (capture -> review -> processing -> results) with its own local state
// machine (`currentStep`) rather than separate routes per step, so captured
// image / camera stream state doesn't have to survive a navigation. The
// former standalone "intro" step is merged into "capture" as a two-column
// layout (consent left, capture controls right — see the capture-step
// render below and the consentGiven gate) rather than its own page, since
// consent and capture are both required before anything else can happen and
// splitting them across a page boundary was pure friction.
// A top-level `activeTab` sits above that: "Upload" and "Camera" are the two
// capture methods (each drives the same shared capture -> review ->
// processing -> results sequence, just showing one panel instead of the old
// side-by-side choice), and "Advice" is the general skin-advice chat, shared
// with /skin-advice. Switching between Upload and Camera mid-scan restarts
// capture with the new method (see selectTab below); switching to/from
// Advice never resets wizard state, only pauses an active camera stream.
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { classifyLuminance, type LightingBand } from "@/lib/scan/lighting"
import { SkinAdviceChat } from "@/components/skin-advice/skin-advice-chat"

type ScanStep = "capture" | "review" | "processing" | "results"
type ScanInputMethod = "camera" | "upload" | null
type ScanAnalysis = {
  summary: string
  cosmeticFindings: Array<{
    label: string
    band: string
    observation: string
  }>
  recommendations: Array<{
    title: string
    reason: string
    category?: string
    imagePath?: string
  }>
  routineTips: string[]
  quality: {
    lighting: string
    framing: string
    confidence: string
  }
  disclaimer: string
  source: "gemini" | "fallback"
  model: string
}

// Mirrors lib/climate/adapter.ts's ClimateSnapshot — location is required to
// reach the results step at all now (see LocationPrompt), so a null climate
// here only ever means Open-Meteo itself failed (network/timeout/unexpected
// shape), not "user skipped location." The UI still must not imply climate
// was used when it wasn't (see the Results-step indicator).
type ClimateInfo = {
  temperatureC: number
  humidityPercent: number
  uvIndex: number
}

// "unsupported" is a distinct, non-retryable dead end (no
// navigator.geolocation, or not a secure context) from "denied" (user
// declined, or a transient PositionError) — see requestLocation and
// LocationPrompt below.
type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported"

type AnalyzeScanResponse = {
  success: boolean
  fallback: boolean
  error?: string
  analysis: ScanAnalysis | null
  report?: {
    id: string
    scanId: string
    createdAt: string
  }
  reportDownloadUrl?: string
  climate?: ClimateInfo | null
}

type ImageEditState = {
  offsetX: number
  offsetY: number
  zoom: number
  rotation: number
  flipX: boolean
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
} | null

const defaultImageEdit: ImageEditState = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  rotation: 0,
  flipX: false,
}

const steps: Array<{ id: ScanStep; label: string }> = [
  { id: "capture", label: "Consent & Capture" },
  { id: "review", label: "Review" },
  { id: "processing", label: "Processing" },
  { id: "results", label: "Results" },
]

const stepCopy: Record<ScanStep, { title: string; description: string }> = {
  capture: {
    title: "Start your free cosmetic skin scan",
    description:
      "Aurora SkinSense keeps this flow privacy-first: review the notice and give consent, then use your camera or upload an existing image. Keep your face centered with even lighting for the clearest cosmetic skin review.",
  },
  review: {
    title: "Review your selected image",
    description:
      "Make sure the image is clear before continuing. You can retake, replace, or remove it before processing.",
  },
  processing: {
    title: "Reviewing visible cosmetic indicators",
    description:
      "Aurora is preparing coarse cosmetic insight bands for visible texture, tone unevenness, hydration appearance, and redness appearance.",
  },
  results: {
    title: "Your cosmetic skin report is ready",
    description:
      "This sample result is cosmetic wellness guidance only and is not a medical diagnosis.",
  },
}

const captureTips = [
  "Face centered in frame",
  "Even lighting preferred",
  "No medical diagnosis",
  "Image reviewed only after consent",
] as const

const processingChecks = [
  "Image received",
  "Gemini review",
  "Cosmetic report",
] as const

function StepIndicator({ currentStep }: { currentStep: ScanStep }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Step {currentIndex + 1} of {steps.length}
        </span>
        <span className="text-foreground">{steps[currentIndex]?.label}</span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index <= currentIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
}

function PrivacyNotice() {
  return (
    <div className="rounded-lg border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
      <IconShieldCheck className="mr-2 inline size-4 text-primary" />
      Aurora SkinSense provides cosmetic skin wellness insights and product
      recommendations only. This is not a medical diagnosis tool.
    </div>
  )
}

// Required, not optional: product decision reversed the earlier
// graceful-fallback design (was: decline/unavailable just meant no climate
// boost, scan proceeded regardless — see git history on this component and
// on app/api/scan/analyze/route.ts's old getScanClimate for that prior
// behavior, kept discoverable in case this is reversed again). Shown at the
// capture step, alongside where camera permission is requested and the
// scan consent checkbox lives, same "clear prompt/button, never silent"
// standard as that consent checkbox (AGENTS.md's "explicit consent before
// first scan" non-negotiable). The
// capture action itself stays disabled until status is "granted" (see
// CameraPanel/UploadPanel) — this component is the explanation for why.
function LocationPrompt({
  status,
  onRequestLocation,
}: {
  status: LocationStatus
  onRequestLocation: () => void
}) {
  // Idle/granted stay a compact single line — the full explanation only
  // earns its space when there's actually something wrong to act on
  // (denied/unsupported), per the "don't always show the paragraph" rule.
  const isProblem = status === "denied" || status === "unsupported"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted text-sm",
        isProblem ? "p-4" : "p-3"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <IconMapPin className="size-4 shrink-0 text-primary" />
        {status === "granted" ? (
          <span className="text-xs">Location shared</span>
        ) : status === "denied" ? (
          <span>
            Location is required to continue, and wasn&apos;t shared this time. Please allow
            location access, then try again.
          </span>
        ) : status === "unsupported" ? (
          <span>
            Scanning isn&apos;t available in this browser or connection right now — location
            access needs a supported browser and a secure (HTTPS, or localhost) connection.
            Try a different browser, or open this page over HTTPS.
          </span>
        ) : (
          <span className="text-xs">Location required to continue</span>
        )}
      </div>
      {status === "idle" || status === "requesting" || status === "denied" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === "requesting"}
          onClick={onRequestLocation}
        >
          {status === "requesting"
            ? "Requesting..."
            : status === "denied"
              ? "Try Again"
              : "Share Location"}
        </Button>
      ) : null}
    </div>
  )
}

function CameraPanel({
  videoRef,
  canvasRef,
  cameraError,
  isCameraActive,
  consentGiven,
  locationGranted,
  lightingBand,
  onStartCamera,
  onCapture,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  cameraError: string | null
  isCameraActive: boolean
  consentGiven: boolean
  locationGranted: boolean
  lightingBand: LightingBand | "idle"
  onStartCamera: () => void
  onCapture: () => void
}) {
  const isLightingGood = lightingBand === "good"

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {!isCameraActive ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <IconCamera className="mx-auto size-10 text-primary" />
              <p className="mt-4 text-sm font-medium">Camera preview is off</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Start the camera to capture a scan image. Your browser will ask
                for permission.
              </p>
            </div>
          </div>
        ) : null}
        {/* `overflow-hidden` + `rounded-full` on this wrapper clips the
            sweep div below to the oval face-guide shape, so the light band
            only appears to travel within the face outline rather than
            across the whole rectangular video. The sweep runs while
            lightingBand isn't "good" (a real client-side brightness reading
            — see the sampling effect in ScanFlow — not a cosmetic-only
            animation), and stops once lighting is actually good. */}
        <div className="pointer-events-none absolute inset-8 overflow-hidden rounded-full border border-primary/50">
          {isCameraActive && !isLightingGood ? (
            <div className="absolute inset-x-0 h-10 animate-scan-sweep bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-[1px] motion-reduce:hidden" />
          ) : null}
        </div>
        {isCameraActive ? (
          <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            {isLightingGood ? (
              <>
                <IconCheck className="size-3.5 text-primary" />
                Lighting good
              </>
            ) : (
              <>
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                {lightingBand === "too_dark"
                  ? "Lighting too low — move to a brighter area"
                  : lightingBand === "too_bright"
                    ? "Too bright — reduce direct light or glare"
                    : "Checking lighting..."}
              </>
            )}
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {cameraError ? (
        <p className="mt-3 text-sm text-destructive">{cameraError}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={onStartCamera}>
          <IconCamera className="size-4" />
          {isCameraActive ? "Restart Camera" : "Use Camera"}
        </Button>
        <Button
          type="button"
          onClick={onCapture}
          disabled={
            !isCameraActive || !consentGiven || !locationGranted || !isLightingGood
          }
        >
          Capture Image
        </Button>
      </div>
      {!consentGiven ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Check the consent box to enable capture.
        </p>
      ) : !locationGranted ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Share your location above to enable capture — it&apos;s required to complete a
          scan.
        </p>
      ) : isCameraActive && !isLightingGood ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Waiting for good lighting before capture is enabled.
        </p>
      ) : null}
    </div>
  )
}

function UploadPanel({
  fileInputRef,
  consentGiven,
  locationGranted,
  onUpload,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  consentGiven: boolean
  locationGranted: boolean
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const canUpload = consentGiven && locationGranted

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-muted p-6 text-center">
        <div>
          <IconUpload className="mx-auto size-10 text-primary" />
          <p className="mt-4 text-sm font-medium">Upload a clear face image</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            JPG, PNG, or WEBP images work best. Images stay local in this demo
            flow.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={!canUpload}
            onChange={onUpload}
          />
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            disabled={!canUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload className="size-4" />
            Choose Image
          </Button>
          {!consentGiven ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Check the consent box to enable upload.
            </p>
          ) : !locationGranted ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Share your location above to enable upload — it&apos;s required to complete a
              scan.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CaptureStep({
  method,
  videoRef,
  canvasRef,
  fileInputRef,
  cameraError,
  isCameraActive,
  consentGiven,
  locationGranted,
  lightingBand,
  onStartCamera,
  onCapture,
  onUpload,
}: {
  method: "upload" | "camera"
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  cameraError: string | null
  isCameraActive: boolean
  consentGiven: boolean
  locationGranted: boolean
  lightingBand: LightingBand | "idle"
  onStartCamera: () => void
  onCapture: () => void
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="grid gap-5">
      {method === "camera" ? (
        <CameraPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraError={cameraError}
          isCameraActive={isCameraActive}
          consentGiven={consentGiven}
          locationGranted={locationGranted}
          lightingBand={lightingBand}
          onStartCamera={onStartCamera}
          onCapture={onCapture}
        />
      ) : (
        <UploadPanel
          fileInputRef={fileInputRef}
          consentGiven={consentGiven}
          locationGranted={locationGranted}
          onUpload={onUpload}
        />
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            <IconInfoCircle className="size-3.5" />
            Tips for a clear scan
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          <ul className="grid gap-1">
            {captureTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function ReviewStep({
  selectedImage,
  inputMethod,
  imageEdit,
  onEditChange,
  onResetEdit,
  onRetake,
  onRemove,
}: {
  selectedImage: string
  inputMethod: ScanInputMethod
  imageEdit: ImageEditState
  onEditChange: (nextEdit: ImageEditState) => void
  onResetEdit: () => void
  onRetake: () => void
  onRemove: () => void
}) {
  const [dragState, setDragState] = useState<DragState>(null)

  function updateEdit(partialEdit: Partial<ImageEditState>) {
    onEditChange({ ...imageEdit, ...partialEdit })
  }

  function rotateImage(amount: number) {
    updateEdit({ rotation: imageEdit.rotation + amount })
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: imageEdit.offsetX,
      originY: imageEdit.offsetY,
    })
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || dragState.pointerId !== event.pointerId) return

    updateEdit({
      offsetX: dragState.originX + event.clientX - dragState.startX,
      offsetY: dragState.originY + event.clientY - dragState.startY,
    })
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState?.pointerId === event.pointerId) {
      setDragState(null)
    }
  }

  return (
    <div className="grid gap-5">
      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-md touch-none overflow-hidden rounded-xl border border-border bg-muted"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <Image
          src={selectedImage}
          alt="Selected skin scan preview"
          fill
          unoptimized
          className="object-contain select-none"
          draggable={false}
          style={{
            transform: `translate(${imageEdit.offsetX}px, ${imageEdit.offsetY}px) scaleX(${imageEdit.flipX ? -1 : 1}) scale(${imageEdit.zoom}) rotate(${imageEdit.rotation}deg)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-background/35" />
        <div className="pointer-events-none absolute inset-[10%] rounded-full border-2 border-primary/70 shadow-[0_0_0_999px_hsl(var(--background)/0.35)]" />
        <div className="pointer-events-none absolute top-[10%] left-1/2 h-[80%] w-px -translate-x-1/2 bg-primary/30" />
        <div className="pointer-events-none absolute top-1/2 left-[10%] h-px w-[80%] -translate-y-1/2 bg-primary/30" />
        <div className="absolute top-3 left-3 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <IconArrowsMove className="mr-1 inline size-3" />
          Drag to position
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        Image source:{" "}
        {inputMethod === "camera" ? "Camera capture" : "Image upload"}. Position
        your face inside the guide, then continue only if the image is clear and
        you consent to cosmetic analysis.
      </div>
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4">
        <label className="grid gap-2 text-sm font-medium">
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={imageEdit.zoom}
            onChange={(event) =>
              updateEdit({ zoom: Number(event.target.value) })
            }
            className="w-full accent-primary"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateEdit({ zoom: Math.max(1, imageEdit.zoom - 0.1) })
            }
          >
            <IconZoomOut className="size-4" />
            Zoom Out
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateEdit({ zoom: Math.min(3, imageEdit.zoom + 0.1) })
            }
          >
            <IconZoomIn className="size-4" />
            Zoom In
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => rotateImage(-90)}
          >
            <IconRotate className="size-4" />
            Rotate Left
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => rotateImage(90)}
          >
            <IconRotateClockwise className="size-4" />
            Rotate Right
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateEdit({ flipX: !imageEdit.flipX })}
          >
            <IconFlipHorizontal className="size-4" />
            Flip
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetEdit}
          >
            <IconCrop className="size-4" />
            Reset
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={onRetake}>
          <IconRefresh className="size-4" />
          Retake or Replace
        </Button>
        <Button type="button" variant="outline" onClick={onRemove}>
          <IconTrash className="size-4" />
          Remove Image
        </Button>
      </div>
    </div>
  )
}

function ProcessingStep({
  analysisError,
  isAnalyzing,
}: {
  analysisError: string | null
  isAnalyzing: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={
            isAnalyzing
              ? "h-full w-2/3 animate-pulse rounded-full bg-primary"
              : "h-full w-full rounded-full bg-primary"
          }
        />
      </div>
      <div className="grid gap-3">
        {processingChecks.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 text-sm text-muted-foreground"
          >
            {isAnalyzing ? (
              <IconLoader2 className="size-4 animate-spin text-primary" />
            ) : (
              <IconCheck className="size-4 text-primary" />
            )}
            {item}
          </div>
        ))}
      </div>
      {analysisError ? (
        <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
          {analysisError}
        </div>
      ) : null}
    </div>
  )
}

function ResultsStep({
  analysis,
  climate,
}: {
  analysis: ScanAnalysis | null
  climate: ClimateInfo | null
}) {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        No cosmetic report is available yet. Return to review and try again.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border bg-muted p-4">
        <p className="text-sm font-medium">{analysis.summary}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Source:{" "}
          {analysis.source === "gemini"
            ? "Gemini AI analysis"
            : "Fallback guidance"}{" "}
          · Confidence: {analysis.quality.confidence}
        </p>
      </div>
      {climate ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <IconMapPin className="size-4 shrink-0 text-primary" />
          Recommendations tailored using local climate: {Math.round(climate.temperatureC)}°C,{" "}
          {Math.round(climate.humidityPercent)}% humidity, UV index {Math.round(climate.uvIndex)}.
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {analysis.cosmeticFindings.map((finding) => (
          <div
            key={finding.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{finding.label}</p>
            <p className="mt-1 font-medium capitalize">
              {finding.band.replace("_", " ")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {finding.observation}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Aurora recommendations</p>
        <div className="mt-3 grid gap-3">
          {analysis.recommendations.map((recommendation) => (
            <div
              key={recommendation.title}
              className="flex gap-3 rounded-lg border border-border bg-muted p-3 text-sm"
            >
              <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-xs text-muted-foreground">
                {recommendation.imagePath ? (
                  <Image
                    src={recommendation.imagePath}
                    alt={`${recommendation.title} product image`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  "No image"
                )}
              </div>
              <div>
                <p className="font-medium">{recommendation.title}</p>
                {recommendation.category ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recommendation.category}
                  </p>
                ) : null}
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {recommendation.reason}
                </p>
              </div>
            </div>
          ))}
          {analysis.recommendations.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
              No active Aurora products are available for recommendations yet.
            </div>
          ) : null}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
        {analysis.disclaimer}
      </div>
    </div>
  )
}

function ScanPreview({
  currentStep,
  selectedImage,
}: {
  currentStep: ScanStep
  selectedImage: string | null
}) {
  const isProcessing = currentStep === "processing"
  const isResults = currentStep === "results"

  return (
    <div className="relative min-h-80 overflow-hidden rounded-2xl border border-border bg-muted p-4 shadow-sm">
      {selectedImage ? (
        <Image
          src={selectedImage}
          alt="Selected scan preview"
          fill
          unoptimized
          className="object-cover opacity-80"
        />
      ) : (
        <>
          <div className="absolute inset-8 rounded-full border border-primary/40" />
          <div className="absolute inset-x-20 top-16 h-44 rounded-full border border-border bg-background/60" />
        </>
      )}
      <div className="absolute top-20 left-1/2 h-52 w-px -translate-x-1/2 bg-primary/30" />
      <div className="absolute top-36 right-16 left-16 h-px bg-primary/30" />
      <div className="absolute top-24 left-20 size-3 rounded-full bg-primary" />
      <div className="absolute top-40 right-24 size-3 rounded-full bg-primary" />
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {steps.find((step) => step.id === currentStep)?.label}
        </span>
        {isProcessing ? (
          <IconLoader2 className="size-5 animate-spin text-primary" />
        ) : isResults ? (
          <IconCheck className="size-5 text-primary" />
        ) : (
          <IconPhotoScan className="size-5 text-primary" />
        )}
      </div>
      <div className="absolute inset-x-8 bottom-6 z-10 rounded-lg border border-border bg-background/90 p-4 backdrop-blur">
        <p className="text-sm font-medium">
          {isResults
            ? "Balanced profile with mild dryness indicators"
            : isProcessing
              ? "Lighting check, face zones, and report generation in progress"
              : selectedImage
                ? "Selected image ready for review"
                : "Camera preview and upload support"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Coarse cosmetic insight bands only.
        </p>
      </div>
    </div>
  )
}

export function ScanFlow() {
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "advice">(
    "upload"
  )
  const [currentStep, setCurrentStep] = useState<ScanStep>("capture")
  const [inputMethod, setInputMethod] = useState<ScanInputMethod>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageEdit, setImageEdit] = useState<ImageEditState>(defaultImageEdit)
  const [selectedFileName, setSelectedFileName] = useState(
    "aurora-skin-scan.jpg"
  )
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<ScanAnalysis | null>(
    null
  )
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(
    null
  )
  // Real, explicit, unchecked-by-default consent (AGENTS.md's "explicit
  // consent before first scan" non-negotiable) — gates capture/upload the
  // same way locationStatus and lightingBand do (see CameraPanel/
  // UploadPanel). Client-side only, same as before the checkbox existed:
  // there was never a consent flag sent to the server, unlike location and
  // lighting which both have a real server-side enforcement point.
  const [consentGiven, setConsentGiven] = useState(false)
  // Transient only — coords live in component state for this session and
  // are only ever sent as part of the one /api/scan/analyze request that
  // uses them; they're never written to localStorage/cookies/the database
  // (see lib/backend/scan-service.ts's createScanReport for the server
  // side of that same rule).
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle")
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  )
  const [climateUsed, setClimateUsed] = useState<ClimateInfo | null>(null)
  // The persisted Report row's id — createScanReport (called from
  // /api/scan/analyze) always creates this before the response comes back,
  // so it's available as soon as analysis completes. Used to link to the
  // real report page (/reports/[reportId]), which has chat/PDF download.
  const [reportId, setReportId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  // The real lighting-quality gate for the live camera feed — "idle" means
  // no camera stream (or no sample taken yet). Sampled from the same video
  // element that feeds the capture canvas below (see the sampling effect
  // further down), never uploaded or sent anywhere; purely a client-side UX
  // gate on the Capture button (server-side enforcement of the same bands
  // happens separately against the final uploaded file — see
  // lib/backend/image-lighting.ts).
  const [lightingBand, setLightingBand] = useState<LightingBand | "idle">(
    "idle"
  )
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const copy = stepCopy[currentStep]

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  function stopCamera() {
    stopCameraStream()
    setIsCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [])

  // Periodic brightness sampling while the camera is live: draws the current
  // frame onto a small offscreen canvas (downsampled to 32x32 — an
  // approximate reading is all that's needed) and averages luminance
  // (0.299R+0.587G+0.114B per pixel). 400ms is frequent enough to feel live
  // without noticeably taxing the preview.
  useEffect(() => {
    if (!isCameraActive) {
      setLightingBand("idle")
      return
    }

    const sampleCanvas = document.createElement("canvas")
    sampleCanvas.width = 32
    sampleCanvas.height = 32
    const context = sampleCanvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    const intervalId = window.setInterval(() => {
      const video = videoRef.current
      if (!video || !video.videoWidth || !video.videoHeight) return

      context.drawImage(video, 0, 0, 32, 32)
      const { data } = context.getImageData(0, 0, 32, 32)

      let total = 0
      const pixelCount = data.length / 4
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }
      setLightingBand(classifyLuminance(total / pixelCount))
    }, 400)

    return () => window.clearInterval(intervalId)
  }, [isCameraActive])

  async function startCamera() {
    setCameraError(null)

    if (!window.isSecureContext) {
      setCameraError(
        "Camera access requires localhost or HTTPS. Open the scan page from a secure browser context."
      )
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available in this browser.")
      return
    }

    try {
      stopCamera()
      const stream = await requestCameraStream()
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        void videoRef.current.play().catch(() => undefined)
      }
      setInputMethod("camera")
      setIsCameraActive(true)
    } catch (error) {
      stopCameraStream()
      setCameraError(getCameraErrorMessage(error))
      setIsCameraActive(false)
    }
  }

  // Explicit opt-in trigger only — never called automatically.
  // getCurrentPosition's own browser permission prompt is the actual
  // consent gate; this button is what triggers it, same as "Use Camera"
  // triggers the camera permission prompt. "unsupported" is checked first
  // and separately from a denied/failed request: geolocation requires a
  // secure context (HTTPS, or localhost) and browser support, and neither
  // of those will ever change on retry within the same browser/connection —
  // so that case gets its own honest, non-retryable message instead of a
  // "Try again" that can never succeed (see LocationPrompt).
  function requestLocation() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationStatus("unsupported")
      return
    }

    setLocationStatus("requesting")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
        setLocationStatus("granted")
      },
      () => {
        setCoords(null)
        setLocationStatus("denied")
      },
      { timeout: 8000 }
    )
  }

  // Snapshots the current video frame onto the hidden <canvas> (declared in
  // CameraPanel), then reads it back out as a data URL — this is how a
  // <video> stream becomes a still image without any server round-trip.
  function captureImage() {
    const video = videoRef.current
    const canvas = canvasRef.current

    // The Capture Image button is already disabled unless consentGiven,
    // locationStatus is "granted", and lightingBand is "good" (see
    // CameraPanel) — this check is defense in depth only. Location is
    // enforced server-side too (see app/api/scan/analyze/route.ts's
    // parseScanCoordinates); lighting is now enforced server-side as well
    // (see lib/backend/image-lighting.ts). Consent has no server-side
    // counterpart — see consentGiven's declaration above.
    if (
      !video ||
      !canvas ||
      !isCameraActive ||
      !consentGiven ||
      locationStatus !== "granted" ||
      lightingBand !== "good"
    )
      return

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError(
        "Camera preview is still loading. Please wait a moment, then capture again."
      )
      return
    }

    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0, width, height)
    setSelectedImage(canvas.toDataURL("image/jpeg", 0.92))
    setSelectedFileName("aurora-skin-scan.jpg")
    setImageEdit(defaultImageEdit)
    setCameraError(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    setInputMethod("camera")
    stopCamera()
    setCurrentStep("review")
  }

  function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // The Choose Image button/input are already disabled unless
    // consentGiven and locationStatus is "granted" (see UploadPanel) — this
    // check is defense in depth only, since the real (server-enforceable)
    // gate is location, checked server-side too (see
    // app/api/scan/analyze/route.ts).
    if (!file || !consentGiven || locationStatus !== "granted") return

    if (!file.type.startsWith("image/")) {
      setCameraError("Please choose an image file.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result)
        setSelectedFileName(file.name)
        setImageEdit(defaultImageEdit)
        setAnalysisResult(null)
        setAnalysisError(null)
        setReportDownloadUrl(null)
        setReportId(null)
        setClimateUsed(null)
        setInputMethod("upload")
        stopCamera()
        setCurrentStep("review")
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  function retakeImage() {
    setSelectedImage(null)
    setInputMethod(null)
    setImageEdit(defaultImageEdit)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    setCurrentStep("capture")
  }

  function removeImage() {
    setSelectedImage(null)
    setInputMethod(null)
    setImageEdit(defaultImageEdit)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    setCurrentStep("capture")
  }

  function goBack() {
    // No "capture" branch: capture (merged with consent) is the first step
    // now, so there's nowhere to go back to from it — the Back button is
    // hidden for this step (see the nav render below) rather than this
    // function needing a no-op case.
    if (currentStep === "review") setCurrentStep("capture")
    if (currentStep === "processing") setCurrentStep("review")
    if (currentStep === "results") setCurrentStep("processing")
  }

  async function goNext() {
    if (currentStep === "review" && selectedImage) await analyzeSelectedImage()
    if (currentStep === "processing") setCurrentStep("results")
  }

  function restart() {
    stopCamera()
    setSelectedImage(null)
    setSelectedFileName("aurora-skin-scan.jpg")
    setImageEdit(defaultImageEdit)
    setInputMethod(null)
    setCameraError(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    // Consent must be given again for each new scan, not silently carried
    // over from the last one — genuine per-scan consent, not a one-time
    // session flag.
    setConsentGiven(false)
    setCurrentStep("capture")
  }

  // Switching Upload <-> Camera mid-scan is a method change: restart capture
  // with the new method, discarding whatever was captured under the old one
  // (mirrors retakeImage/removeImage's reset). Switching to/from Advice is
  // just a view swap — wizard progress is left untouched, only the camera
  // stream is paused if it was running.
  function selectTab(nextTab: "upload" | "camera" | "advice") {
    if (nextTab === activeTab) return

    if (activeTab === "camera") {
      stopCamera()
    }

    const isMethodSwitch =
      (nextTab === "upload" || nextTab === "camera") &&
      (activeTab === "upload" || activeTab === "camera")

    if (isMethodSwitch) {
      setSelectedImage(null)
      setInputMethod(null)
      setImageEdit(defaultImageEdit)
      setAnalysisResult(null)
      setAnalysisError(null)
      setReportDownloadUrl(null)
      setReportId(null)
      setClimateUsed(null)
      setCurrentStep("capture")
    }

    setActiveTab(nextTab)
  }

  async function analyzeSelectedImage() {
    if (!selectedImage) return

    setCurrentStep("processing")
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)

    try {
      // Bakes the user's crop/zoom/rotate/flip adjustments from the Review
      // step into actual pixels before upload — the server only ever sees
      // the final edited image, never the original plus a set of transforms.
      const editedImage = await createEditedImageDataUrl(
        selectedImage,
        imageEdit
      )
      setSelectedImage(editedImage)
      const imageFile = await dataUrlToFile(editedImage, selectedFileName)
      const formData = new FormData()
      formData.append("image", imageFile)
      formData.append("source", inputMethod ?? "unknown")
      // coords should always be set here: capture itself is gated on
      // locationStatus === "granted" (see CameraPanel/UploadPanel), so this
      // is expected to always be true now. The `if` stays as defense in
      // depth — the server is the actual gate and rejects a missing/invalid
      // lat or lon with a 400 (see app/api/scan/analyze/route.ts).
      if (coords) {
        formData.append("lat", String(coords.lat))
        formData.append("lon", String(coords.lon))
      }

      const response = await fetch("/api/scan/analyze", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as AnalyzeScanResponse

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error ?? "Aurora could not analyze this image.")
      }

      setAnalysisResult(payload.analysis)
      setReportDownloadUrl(payload.reportDownloadUrl ?? null)
      setReportId(payload.report?.id ?? null)
      setClimateUsed(payload.climate ?? null)
      setAnalysisError(
        payload.fallback
          ? (payload.error ?? "Fallback cosmetic report returned.")
          : null
      )
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Aurora could not analyze this image. Please try again."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="grid gap-8">
      <div className="flex gap-2 border-b border-border">
        <TabButton
          active={activeTab === "upload"}
          onClick={() => selectTab("upload")}
        >
          <IconUpload className="size-4" />
          Upload
        </TabButton>
        <TabButton
          active={activeTab === "camera"}
          onClick={() => selectTab("camera")}
        >
          <IconCamera className="size-4" />
          Camera
        </TabButton>
        <TabButton
          active={activeTab === "advice"}
          onClick={() => selectTab("advice")}
        >
          <IconMessageCircle className="size-4" />
          Advice
        </TabButton>
      </div>

      {activeTab === "advice" ? (
        <SkinAdviceChat />
      ) : (
        <>
          <StepIndicator currentStep={currentStep} />

          <section
            className={cn(
              "grid gap-8",
              // Capture step's CameraPanel/UploadPanel is already a single
              // self-contained preview (real video feed, face-guide
              // overlay, and lighting state all merged into one frame — see
              // CameraPanel) — the sidebar's decorative ScanPreview below
              // would just be a second, redundant preview area next to it,
              // so it's dropped entirely for this step and the main column
              // takes the full width instead of leaving an empty gap.
              currentStep !== "capture" && "lg:grid-cols-[1.1fr_0.9fr]"
            )}
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {currentStep !== "capture" ? (
                <>
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
                    <IconSparkles className="size-4" />
                    Aurora SkinSense
                  </p>
                  <h1 className="text-3xl font-semibold tracking-normal">
                    {copy.title}
                  </h1>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {copy.description}
                  </p>
                </>
              ) : null}

              <div className={currentStep !== "capture" ? "mt-8" : undefined}>
                {currentStep === "capture" ? (
                  // Former standalone "intro" (consent) step merged with
                  // "capture" as a two-column layout — left is the intro
                  // copy + privacy notice + consent checkbox, right is the
                  // capture controls, unchanged from before this merge. On
                  // narrow viewports the grid collapses to one column
                  // (consent above, capture below) via the `lg:` prefix.
                  <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
                    <div className="grid content-start gap-5">
                      <div>
                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
                          <IconSparkles className="size-4" />
                          Aurora SkinSense
                        </p>
                        <h1 className="font-heading text-3xl font-semibold tracking-normal">
                          {copy.title}
                        </h1>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                          {copy.description}
                        </p>
                      </div>
                      <PrivacyNotice />
                      <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
                        <Checkbox
                          checked={consentGiven}
                          onCheckedChange={(checked) =>
                            setConsentGiven(checked === true)
                          }
                          className="mt-0.5"
                        />
                        <span className="leading-6 text-foreground">
                          I understand and agree to proceed with a cosmetic
                          skin scan. My image is reviewed only after I
                          capture or upload it, and this is cosmetic
                          wellness guidance only — not a medical diagnosis.
                        </span>
                      </label>
                    </div>

                    <div className="grid content-start gap-5 lg:border-l lg:border-border lg:pl-10">
                      <LocationPrompt
                        status={locationStatus}
                        onRequestLocation={requestLocation}
                      />
                      <CaptureStep
                        method={activeTab}
                        videoRef={videoRef}
                        canvasRef={canvasRef}
                        fileInputRef={fileInputRef}
                        cameraError={cameraError}
                        isCameraActive={isCameraActive}
                        consentGiven={consentGiven}
                        locationGranted={locationStatus === "granted"}
                        lightingBand={lightingBand}
                        onStartCamera={() => void startCamera()}
                        onCapture={captureImage}
                        onUpload={uploadImage}
                      />
                    </div>
                  </div>
                ) : null}
                {currentStep === "review" && selectedImage ? (
                  <ReviewStep
                    selectedImage={selectedImage}
                    inputMethod={inputMethod}
                    imageEdit={imageEdit}
                    onEditChange={setImageEdit}
                    onResetEdit={() => setImageEdit(defaultImageEdit)}
                    onRetake={retakeImage}
                    onRemove={removeImage}
                  />
                ) : null}
                {currentStep === "processing" ? (
                  <ProcessingStep
                    analysisError={analysisError}
                    isAnalyzing={isAnalyzing}
                  />
                ) : null}
                {currentStep === "results" ? (
                  <ResultsStep analysis={analysisResult} climate={climateUsed} />
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {currentStep !== "capture" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={isAnalyzing}
                  >
                    <IconChevronLeft className="size-4" />
                    Back
                  </Button>
                ) : null}
                {currentStep === "results" ? (
                  <>
                    <Button type="button" onClick={restart}>
                      Start New Scan
                    </Button>
                    {reportId ? (
                      <Button type="button" variant="outline" asChild>
                        <Link href={`/reports/${reportId}`}>
                          <IconReportAnalytics className="size-4" />
                          View Full Report
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!reportDownloadUrl}
                      onClick={() => {
                        if (reportDownloadUrl)
                          window.open(
                            reportDownloadUrl,
                            "_blank",
                            "noopener,noreferrer"
                          )
                      }}
                    >
                      <IconDownload className="size-4" />
                      Download PDF
                    </Button>
                  </>
                ) : currentStep === "capture" ? null : (
                  <Button
                    type="button"
                    onClick={() => void goNext()}
                    disabled={
                      (currentStep === "review" && !selectedImage) ||
                      (currentStep === "processing" &&
                        (isAnalyzing || !analysisResult))
                    }
                  >
                    {currentStep === "processing"
                      ? isAnalyzing
                        ? "Analyzing..."
                        : "View Results"
                      : "Continue to Processing"}
                  </Button>
                )}
              </div>
            </div>

            {currentStep !== "capture" ? (
              <div className="grid content-start gap-4">
                <ScanPreview
                  currentStep={currentStep}
                  selectedImage={selectedImage}
                />
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const type = blob.type || "image/jpeg"

  return new File([blob], ensureImageExtension(fileName, type), { type })
}

// Renders the ReviewStep's live-preview CSS transform
// (translate -> flip/scale -> rotate, applied via `style.transform`) as
// actual canvas pixels. The order of canvas calls below matters: `context`
// transforms compose like a stack, so translate must happen first (moves
// the origin to the image's target center), then rotate, then scale —
// applying them in a different order would rotate/scale around the wrong
// point and produce a different result than what the user saw in preview.
async function createEditedImageDataUrl(dataUrl: string, edit: ImageEditState) {
  const image = await loadEditableImage(dataUrl)
  const canvas = document.createElement("canvas")
  // Fixed 4:5 portrait output regardless of the source image's own aspect
  // ratio, so every report image is consistently framed.
  const width = 900
  const height = 1125
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) return dataUrl

  // Scales the source image down to fit inside the canvas before any user
  // zoom is applied, so `edit.zoom` is relative to "fit the frame", not to
  // the image's raw pixel size.
  const baseScale = Math.min(
    width / image.naturalWidth,
    height / image.naturalHeight
  )
  const drawWidth = image.naturalWidth * baseScale
  const drawHeight = image.naturalHeight * baseScale

  context.fillStyle = "white"
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.translate(width / 2 + edit.offsetX, height / 2 + edit.offsetY)
  context.rotate((edit.rotation * Math.PI) / 180)
  context.scale((edit.flipX ? -1 : 1) * edit.zoom, edit.zoom)
  context.drawImage(
    image,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  )

  return canvas.toDataURL("image/jpeg", 0.92)
}

function loadEditableImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new globalThis.Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error("Selected image could not be edited."))
    image.src = dataUrl
  })
}

// Asks for a front-facing camera at a preferred resolution first; if the
// device/browser can't satisfy those specific constraints (common on older
// or unusual hardware), retries with the loosest possible request
// (`video: true`) rather than failing outright — better to get some camera
// stream than none.
async function requestCameraStream() {
  const preferredConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: { ideal: "user" },
      height: { ideal: 960 },
      width: { ideal: 1280 },
    },
  }

  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints)
  } catch (error) {
    if (!shouldRetryWithBasicCamera(error)) {
      throw error
    }

    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    })
  }
}

// Only retry for errors that mean "constraints too specific" or "no
// matching device" — permission/security errors (NotAllowedError etc.)
// would just fail the same way again, so those are re-thrown immediately
// instead of masking the real problem with a second failed request.
function shouldRetryWithBasicCamera(error: unknown) {
  if (!(error instanceof DOMException)) return true

  return (
    error.name === "OverconstrainedError" ||
    error.name === "ConstraintNotSatisfiedError" ||
    error.name === "NotFoundError" ||
    error.name === "NotReadableError"
  )
}

function getCameraErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return "Camera could not be started. Please try again or upload an image instead."
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Camera permission is blocked. Allow camera access in your browser settings, then try again."
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "No camera was found. Connect a camera or upload an image instead."
  }

  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "Your camera is already in use by another app or browser tab. Close it, then try again."
  }

  if (
    error.name === "OverconstrainedError" ||
    error.name === "ConstraintNotSatisfiedError"
  ) {
    return "This camera does not support the preferred scan settings. Please try again or upload an image."
  }

  return "Camera could not be started. Please try again or upload an image instead."
}

function ensureImageExtension(fileName: string, mimeType: string) {
  const baseName = fileName.replace(/\.(jpe?g|png|webp)$/i, "")

  if (mimeType === "image/png") return `${baseName}.png`
  if (mimeType === "image/webp") return `${baseName}.webp`
  return `${baseName}.jpg`
}
