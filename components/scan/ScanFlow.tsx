"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { AuroraLogomark } from "@/components/brand/aurora-logomark"
import { TrustSignalRow } from "@/components/ui/trust-signal-row"
import {
  IconArrowsMove,
  IconCamera,
  IconCheck,
  IconChevronLeft,
  IconCloudUpload,
  IconCrop,
  IconDownload,
  IconFlipHorizontal,
  IconLayoutDashboard,
  IconLoader2,
  IconLock,
  IconMapPin,
  IconMessageCircle,
  IconPhoto,
  IconPhotoScan,
  IconRefresh,
  IconReportAnalytics,
  IconRotate,
  IconRotateClockwise,
  IconSparkles,
  IconSun,
  IconTrash,
  IconUpload,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react"

// The entire scan flow as one client component: a linear three-step wizard
// (capture -> processing -> results) with its own local state machine
// (`currentStep`) rather than separate routes per step, so captured image /
// camera stream state doesn't have to survive a navigation. The former
// standalone "review" step (crop/pan/zoom/rotate/flip) is merged into
// "capture": once selectedImage is set, the capture step's own content
// swaps in place from the live camera/upload picker to the ReviewStep
// editor — no step/currentStep change, just a `selectedImage` branch within
// the same "capture" step (see the capture-step render below). This also
// means the sidebar's decorative ScanPreview panel — already dropped from
// the pre-image capture UI as redundant — naturally stays dropped for the
// editing UI too, since ScanPreview only ever renders for `currentStep !==
// "capture"`, which editing never leaves.
//
// Consent and location used to both gate this step directly (an unchecked
// checkbox + a manual "Share Location" button, see git history). Consent is
// now a one-time acknowledgment given at signup — or on an existing
// account's first visit here — via app/(onboarding)/onboarding/consent, so
// by the time this component ever renders, consent is already guaranteed
// (app/(scan)/scan/page.tsx redirects there otherwise) and there is no
// consent state here at all anymore. Location still can't be a one-time
// grant in the same way (permission can be revoked or simply unavailable on
// any given visit), so it's re-checked silently on mount (see the
// useEffect below) instead of behind a manual button — success is
// invisible, failure surfaces a lightweight banner and blocks capture,
// same disabled-button mechanics as before, just without the always-on
// gate box when there's nothing wrong to report.
//
// A top-level `activeTab` sits above that: "Upload" and "Camera" are the two
// capture methods (each drives the same shared capture -> processing ->
// results sequence, just showing one panel instead of the old side-by-side
// choice), and "Advice" is the general skin-advice chat, shared with
// /skin-advice. Switching between Upload and Camera mid-scan restarts
// capture with the new method (see selectTab below); switching to/from
// Advice never resets wizard state, only pauses an active camera stream.
import { Button } from "@/components/ui/button"
import { ScanCaptureTips } from "@/components/scan/ScanCaptureTips"
import { cn } from "@/lib/utils"
import {
  useScanQuality,
  type LandmarkerStatus,
  type VideoDimensions,
} from "@/lib/scan/quality/use-scan-quality"
import type { QualitySnapshot } from "@/lib/scan/quality/types"
import type { FaceBoundingBox } from "@/lib/scan/quality/checks"
import { ScanQualityPanel } from "@/components/scan/ScanQualityPanel"
import { FacePositionOverlay } from "@/components/scan/FacePositionOverlay"
import { ScanCameraPicker } from "@/components/scan/scan-camera-picker"
import {
  enumerateVideoDevices,
  getDeviceLabel,
  resolvePreferredDeviceId,
  type VideoDeviceOption,
} from "@/lib/scan/camera-devices"
import { computeInitialImageEdit } from "@/lib/scan/face-crop"
import { requestGeolocation } from "@/lib/scan/geolocation"
import { SkinAdviceChat } from "@/components/skin-advice/skin-advice-chat"

type ScanStep = "capture" | "processing" | "results"
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
type LocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "unsupported"

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
  { id: "capture", label: "Capture & Review" },
  { id: "processing", label: "Processing" },
  { id: "results", label: "Results" },
]

const stepCopy: Record<ScanStep, { title: string; description: string }> = {
  // Reference copy exactly ("Scan your skin" / "Clear photo, personalized
  // guidance & product picks") — the medical-framing disclaimer that used
  // to live in this description isn't lost, just relocated: it's the
  // actual, authoritative disclaimer text already shown on every generated
  // report (see ResultsStep's analysis.disclaimer block below), so nothing
  // here silently drops that non-negotiable, it's just no longer duplicated
  // on the pre-capture landing blurb too.
  capture: {
    title: "Scan your skin",
    description: "Clear photo, personalized guidance & product picks",
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

// Required, not optional: product decision reversed the earlier
// graceful-fallback design (was: decline/unavailable just meant no climate
// boost, scan proceeded regardless — see git history on this component and
// on app/api/scan/analyze/route.ts's old getScanClimate for that prior
// behavior, kept discoverable in case this is reversed again). Location is
// now re-checked silently on mount (see ScanFlow's useEffect) instead of a
// manual button — this banner renders NOTHING for "idle"/"requesting"/
// "granted" (success and in-progress are invisible, per the brief), and
// only appears once the silent check has actually failed, with a retry
// action. Capture/upload themselves stay disabled until status is
// "granted" (see CameraPanel/UploadPanel) — this is just the explanation
// for why, shown only when there's something to explain.
function LocationFailureBanner({
  status,
  onRetry,
}: {
  status: LocationStatus
  onRetry: () => void
}) {
  if (status !== "denied" && status !== "unsupported") return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
      <div className="flex items-center gap-2">
        <IconMapPin className="size-4 shrink-0" />
        {status === "denied" ? (
          <span>
            Location access is needed to complete a scan, and wasn&apos;t available just now. Check this
            site&apos;s permissions in your browser settings to allow location, then try again.
          </span>
        ) : (
          <span>
            Scanning isn&apos;t available in this browser or connection right now — location access needs a
            supported browser and a secure (HTTPS, or localhost) connection. Try a different browser, or open
            this page over HTTPS.
          </span>
        )}
      </div>
      {status === "denied" ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try Again
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
  locationGranted,
  scansExhausted,
  qualitySnapshot,
  landmarkerStatus,
  faceBox,
  videoDimensions,
  devices,
  activeDeviceId,
  activeDeviceLabel,
  switchingCamera,
  onStartCamera,
  onCapture,
  onSelectDevice,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  cameraError: string | null
  isCameraActive: boolean
  locationGranted: boolean
  scansExhausted: boolean
  qualitySnapshot: QualitySnapshot | null
  landmarkerStatus: LandmarkerStatus
  faceBox: FaceBoundingBox | null
  videoDimensions: VideoDimensions | null
  devices: VideoDeviceOption[]
  activeDeviceId: string | null
  activeDeviceLabel: string | null
  switchingCamera: boolean
  onStartCamera: () => void
  onCapture: () => void
  onSelectDevice: (deviceId: string) => void
}) {
  const readyToCapture = qualitySnapshot?.readyToCapture ?? false
  const facePositionStatus =
    qualitySnapshot?.results.find((result) => result.id === "facePosition")
      ?.status ?? "fail"

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted transition-colors",
          readyToCapture ? "border-success" : "border-border"
        )}
      >
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
        {/* `overflow-hidden` + `rounded-full` on this wrapper clips the sweep
            div below to roughly the face-guide area, so it only appears to
            travel within the guide rather than across the whole rectangular
            video. The sweep runs while the live quality checklist isn't
            ready to capture yet (a real client-side reading — see
            lib/scan/quality/use-scan-quality.ts — not a cosmetic-only
            animation), and stops once every check actually passes. The
            guide shape itself (border) is now drawn by FacePositionOverlay
            below, in the same coordinate space evaluateFacePosition scores
            against, rather than a separately hand-placed inset here. */}
        <div className="pointer-events-none absolute inset-8 overflow-hidden rounded-full">
          {isCameraActive && !readyToCapture ? (
            <div className="absolute inset-x-0 h-10 animate-scan-sweep bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-[1px] motion-reduce:hidden" />
          ) : null}
        </div>
        {isCameraActive ? (
          <FacePositionOverlay
            faceBox={faceBox}
            videoDimensions={videoDimensions}
            status={facePositionStatus}
          />
        ) : null}
        {isCameraActive ? (
          <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            {readyToCapture ? (
              <>
                <IconCheck className="size-3.5 text-success" />
                Ready to capture
              </>
            ) : (
              <>
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                {landmarkerStatus === "loading" && !qualitySnapshot
                  ? "Loading face detection…"
                  : `${qualitySnapshot?.score ?? 0}% · ${qualitySnapshot?.scoreBand ?? "Poor"}`}
              </>
            )}
          </div>
        ) : null}
        {isCameraActive ? (
          <div className="absolute top-3 right-3">
            <ScanCameraPicker
              devices={devices}
              activeDeviceId={activeDeviceId}
              activeLabel={activeDeviceLabel}
              onSelect={onSelectDevice}
              disabled={switchingCamera}
              switching={switchingCamera}
            />
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {isCameraActive ? (
        <div className="mt-3">
          <ScanQualityPanel
            snapshot={qualitySnapshot}
            landmarkerStatus={landmarkerStatus}
          />
        </div>
      ) : null}
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
            !isCameraActive ||
            !locationGranted ||
            scansExhausted ||
            !readyToCapture
          }
          className={cn(
            readyToCapture &&
              "ring-2 ring-success ring-offset-2 ring-offset-background"
          )}
        >
          {isCameraActive && !readyToCapture
            ? "Improve image quality"
            : "Capture Image"}
        </Button>
      </div>
      {scansExhausted ? (
        <p className="mt-3 text-xs font-medium text-foreground">
          You&apos;ve used all 10 of your free scans. We&apos;re not offering
          paid scans yet — check back soon.
        </p>
      ) : !locationGranted ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Confirming location access — capture enables automatically once that&apos;s ready.
        </p>
      ) : isCameraActive && !readyToCapture ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Waiting for image quality checks to pass before capture is enabled.
        </p>
      ) : null}
    </div>
  )
}

function UploadPanel({
  fileInputRef,
  locationGranted,
  scansExhausted,
  onUpload,
  onDropFile,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  locationGranted: boolean
  scansExhausted: boolean
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDropFile: (file: File | undefined) => void
}) {
  const canUpload = locationGranted && !scansExhausted
  const [isDragging, setIsDragging] = useState(false)

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!canUpload) return
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  // Funnels into the exact same handleSelectedFile validation/consent/
  // location gate the file-input's onChange already uses (see ScanFlow's
  // handleSelectedFile) — real drag-and-drop, not a second upload path.
  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (!canUpload) return
    onDropFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "grid min-h-64 place-items-center rounded-2xl border border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/40",
          !canUpload && "opacity-70"
        )}
      >
        <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-muted">
            <IconCloudUpload className="size-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">Drop your photo here</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            A clear, well-lit photo with your face fully visible
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
            Browse photos
          </Button>
          {scansExhausted ? (
            <p className="mt-3 text-xs font-medium text-foreground">
              You&apos;ve used all 10 of your free scans. We&apos;re not
              offering paid scans yet — check back soon.
            </p>
          ) : !locationGranted ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Confirming location access — upload enables automatically once that&apos;s ready.
            </p>
          ) : null}
        </div>
      </div>

      {/* Trust-signal footer: our real accepted formats and 8MB limit
          (app/api/scan/analyze/route.ts's ALLOWED_IMAGE_TYPES/
          MAX_IMAGE_SIZE — the limit was already server-enforced but never
          shown to the user until now), the same lighting guidance used
          elsewhere in this flow, and the verified-true privacy claim from
          the prior audit (traced the real pipeline end to end: the image
          is only ever held in memory — Buffer/sharp/base64-to-Gemini —
          and createScanReport's image param is metadata-only, so this
          replaces, not duplicates, the old "Images are not stored in the
          system" sentence with a more precise true statement). */}
      <TrustSignalRow
        items={[
          { icon: IconPhoto, label: "JPG, PNG, or WEBP · up to 8MB" },
          { icon: IconSun, label: "Soft, even lighting works best" },
          { icon: IconLock, label: "Analyzed in memory, never stored" },
        ]}
      />
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
  locationGranted,
  scansExhausted,
  qualitySnapshot,
  landmarkerStatus,
  faceBox,
  videoDimensions,
  devices,
  activeDeviceId,
  activeDeviceLabel,
  switchingCamera,
  onStartCamera,
  onCapture,
  onUpload,
  onDropFile,
  onSelectDevice,
}: {
  method: "upload" | "camera"
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  cameraError: string | null
  isCameraActive: boolean
  locationGranted: boolean
  scansExhausted: boolean
  qualitySnapshot: QualitySnapshot | null
  landmarkerStatus: LandmarkerStatus
  faceBox: FaceBoundingBox | null
  videoDimensions: VideoDimensions | null
  devices: VideoDeviceOption[]
  activeDeviceId: string | null
  activeDeviceLabel: string | null
  switchingCamera: boolean
  onStartCamera: () => void
  onCapture: () => void
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDropFile: (file: File | undefined) => void
  onSelectDevice: (deviceId: string) => void
}) {
  return (
    <div className="grid gap-5">
      {method === "camera" ? (
        <CameraPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraError={cameraError}
          isCameraActive={isCameraActive}
          locationGranted={locationGranted}
          scansExhausted={scansExhausted}
          qualitySnapshot={qualitySnapshot}
          landmarkerStatus={landmarkerStatus}
          faceBox={faceBox}
          videoDimensions={videoDimensions}
          devices={devices}
          activeDeviceId={activeDeviceId}
          activeDeviceLabel={activeDeviceLabel}
          switchingCamera={switchingCamera}
          onStartCamera={onStartCamera}
          onCapture={onCapture}
          onSelectDevice={onSelectDevice}
        />
      ) : (
        <UploadPanel
          fileInputRef={fileInputRef}
          locationGranted={locationGranted}
          scansExhausted={scansExhausted}
          onUpload={onUpload}
          onDropFile={onDropFile}
        />
      )}
    </div>
  )
}

function ReviewStep({
  selectedImage,
  inputMethod,
  imageEdit,
  initialFaceBox,
  onEditChange,
  onResetEdit,
  onRetake,
  onRemove,
  onContinue,
}: {
  selectedImage: string
  inputMethod: ScanInputMethod
  imageEdit: ImageEditState
  initialFaceBox: { box: FaceBoundingBox; width: number; height: number } | null
  onEditChange: (nextEdit: ImageEditState) => void
  onResetEdit: () => void
  onRetake: () => void
  onRemove: () => void
  onContinue: () => void
}) {
  const [dragState, setDragState] = useState<DragState>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  function updateEdit(partialEdit: Partial<ImageEditState>) {
    onEditChange({ ...imageEdit, ...partialEdit })
  }

  // Runs once per newly captured/uploaded image (keyed on selectedImage
  // alone) — recenters the starting pan on the detected face instead of
  // leaving it dead-center, using the container's actual rendered size
  // (only knowable once mounted). Never re-fires after the user starts
  // dragging, since selectedImage doesn't change again until a new capture.
  // No-ops for uploads or a faceless capture (initialFaceBox is null there),
  // leaving today's centered default exactly as it was.
  useEffect(() => {
    if (!initialFaceBox) return
    const container = containerRef.current
    if (!container) return

    const { width: containerWidth, height: containerHeight } =
      container.getBoundingClientRect()
    if (containerWidth <= 0 || containerHeight <= 0) return

    const recentered = computeInitialImageEdit(
      initialFaceBox.box,
      initialFaceBox.width,
      initialFaceBox.height,
      containerWidth,
      containerHeight
    )
    onEditChange(recentered)
    // Deliberately excludes onEditChange/initialFaceBox from deps — this
    // must fire exactly once per new image, not whenever the parent
    // re-creates its onEditChange closure or a stale initialFaceBox
    // reference changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage])

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
        ref={containerRef}
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
          className="object-cover select-none"
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
        <Button type="button" onClick={onContinue}>
          Continue to Processing
        </Button>
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
        No cosmetic report is available yet. Go back and try again.
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
          Recommendations tailored using local climate:{" "}
          {Math.round(climate.temperatureC)}°C,{" "}
          {Math.round(climate.humidityPercent)}% humidity, UV index{" "}
          {Math.round(climate.uvIndex)}.
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

export function ScanFlow({
  scansRemaining,
}: {
  // Real per-user free-scan balance from app/(scan)/scan/page.tsx's server-
  // side getRemainingScans — null means no allowance applies (anonymous,
  // unmetered scanning), never "zero remaining". The server in
  // app/api/scan/analyze/route.ts is the actual enforcement point; this
  // only lets the Capture step explain a block honestly up front instead of
  // showing a plain disabled button, same as the consent/location/lighting
  // gates already do.
  scansRemaining: number | null
}) {
  const scansExhausted = scansRemaining !== null && scansRemaining <= 0

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
  // Transient only — coords live in component state for this session and
  // are only ever sent as part of the one /api/scan/analyze request that
  // uses them; they're never written to localStorage/cookies/the database
  // (see lib/backend/scan-service.ts's createScanReport for the server
  // side of that same rule). Populated by a silent background re-check
  // (see the useEffect below), not a manual button — consent was already
  // given once at signup (app/(onboarding)/onboarding/consent) and is
  // guaranteed by the time this component ever renders (app/(scan)/scan/
  // page.tsx redirects there otherwise), so there is no equivalent
  // consent state here anymore.
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
  // Multi-camera device selection — populated once permission is granted
  // (device labels are blank until then), never touches the quality-gate
  // pipeline itself: switching devices only re-points videoRef.current's
  // srcObject at a new stream, and lib/scan/quality/use-scan-quality.ts's
  // polling loop keeps sampling videoRef.current fresh on every interval
  // tick regardless of which stream is attached, so it re-evaluates against
  // the new camera automatically.
  const [devices, setDevices] = useState<VideoDeviceOption[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [switchingCamera, setSwitchingCamera] = useState(false)
  // Set only by a camera capture that had a live faceBox at the moment of
  // capture (see captureImage) — null for uploads and for a capture where
  // the quality gate hadn't detected a face. ReviewStep uses this once, on
  // mount, to compute a face-centered starting pan position; it never
  // re-applies it after the user starts dragging (see ReviewStep's effect,
  // keyed on `selectedImage` alone).
  const [initialFaceBox, setInitialFaceBox] = useState<{
    box: FaceBoundingBox
    width: number
    height: number
  } | null>(null)
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

  // Runs once per page load — matching how the previous manual "Share
  // Location" button only ever ran once per visit too. Retake/restart
  // reuse whatever coords this already found (see retakeImage/restart
  // below, neither resets locationStatus/coords); they don't re-trigger
  // this.
  useEffect(() => {
    void checkLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live pre-capture quality checklist (face detection/position, lighting,
  // sharpness, stability, resolution, eyes — hard gates; rotation,
  // occlusion, expression, background, skin visibility — soft warnings).
  // Only "active" while the camera stream is actually live AND the Camera
  // tab is the one showing — this is also what triggers the face-landmark
  // model's lazy load (see lib/scan/quality/face-landmarker.ts), so simply
  // switching to the Upload or Advice tab, or finishing a capture, tears it
  // down again rather than keeping a heavy model resident for no reason.
  const {
    snapshot: qualitySnapshot,
    landmarkerStatus,
    faceBox,
    videoDimensions,
  } = useScanQuality(videoRef, isCameraActive && activeTab === "camera")

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
      // Device labels are blank until permission is granted, so enumeration
      // only happens now, not before the first getUserMedia call. Reflects
      // whichever device the browser actually picked (not necessarily the
      // first in the list), read from the live track's own settings.
      const nextDevices = await enumerateVideoDevices()
      setDevices(nextDevices)
      const actualDeviceId =
        stream.getVideoTracks()[0]?.getSettings().deviceId ?? null
      setActiveDeviceId(resolvePreferredDeviceId(nextDevices, actualDeviceId))
    } catch (error) {
      stopCameraStream()
      setCameraError(getCameraErrorMessage(error))
      setIsCameraActive(false)
    }
  }

  // Switches the live stream to a different video input device mid-session
  // without tearing down useScanQuality's polling loop — that hook's effect
  // only depends on [active, videoRef] (see lib/scan/quality/
  // use-scan-quality.ts), neither of which changes here, so it keeps
  // sampling videoRef.current on its own interval and picks up the new
  // stream's frames automatically on the very next tick. Left untouched
  // deliberately, per this feature's scope.
  async function selectDevice(deviceId: string) {
    if (deviceId === activeDeviceId || switchingCamera) return

    setSwitchingCamera(true)
    setCameraError(null)

    try {
      const stream = await requestCameraStream(deviceId)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        void videoRef.current.play().catch(() => undefined)
      }
      const actualDeviceId =
        stream.getVideoTracks()[0]?.getSettings().deviceId ?? deviceId
      setActiveDeviceId(actualDeviceId)
    } catch (error) {
      setCameraError(getCameraErrorMessage(error))
    } finally {
      setSwitchingCamera(false)
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
  // Silent by design — called automatically on mount (see the effect
  // below), never from a visible button. Permission was already granted
  // once at signup, so this normally resolves without a new browser
  // prompt at all; it only surfaces anything to the user (via
  // LocationFailureBanner) if the result is actually denied/unsupported —
  // also reused as the banner's manual "Try Again" action once that
  // happens.
  async function checkLocation() {
    setLocationStatus("requesting")
    const result = await requestGeolocation()

    if (result.status === "granted") {
      setCoords({ lat: result.lat, lon: result.lon })
      setLocationStatus("granted")
      return
    }

    setCoords(null)
    setLocationStatus(result.status)
  }

  // Snapshots the current video frame onto the hidden <canvas> (declared in
  // CameraPanel), then reads it back out as a data URL — this is how a
  // <video> stream becomes a still image without any server round-trip.
  function captureImage() {
    const video = videoRef.current
    const canvas = canvasRef.current

    // The Capture Image button is already disabled unless locationStatus
    // is "granted" and the live quality checklist reports readyToCapture
    // (see CameraPanel) — this check is defense in depth only. Location is
    // enforced server-side too (see app/api/scan/analyze/route.ts's
    // parseScanCoordinates); lighting (one of the checklist's hard gates)
    // is enforced server-side as well (see lib/backend/image-lighting.ts).
    // The rest of the client-only checklist checks have no server-side
    // counterpart.
    if (
      !video ||
      !canvas ||
      !isCameraActive ||
      locationStatus !== "granted" ||
      !qualitySnapshot?.readyToCapture
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
    // faceBox (from the live quality gate, unmodified) is normalized against
    // this exact same video.videoWidth/videoHeight frame, so its coordinates
    // apply directly to the just-captured still — ReviewStep uses this to
    // give the pan/zoom a face-centered starting position instead of always
    // defaulting to dead-center (see computeInitialImageEdit). Upload has no
    // live faceBox at all, so it's always null there — falls back to the
    // centered default, same as before this feature existed.
    setInitialFaceBox(faceBox ? { box: faceBox, width, height } : null)
    setCameraError(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    setInputMethod("camera")
    stopCamera()
  }

  // Shared by both the file-input's onChange and the dropzone's onDrop —
  // same validation, same location gate, same end state either way. The
  // gate here is defense in depth only (both entry points are already
  // disabled in the UI unless locationStatus is "granted" — see
  // UploadPanel); the real, server-enforceable gate is location, checked
  // again in app/api/scan/analyze/route.ts.
  function handleSelectedFile(file: File | undefined) {
    if (!file || locationStatus !== "granted") return

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
        setInitialFaceBox(null)
        setAnalysisResult(null)
        setAnalysisError(null)
        setReportDownloadUrl(null)
        setReportId(null)
        setClimateUsed(null)
        setInputMethod("upload")
        stopCamera()
      }
    }
    reader.readAsDataURL(file)
  }

  function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    handleSelectedFile(event.target.files?.[0])
    event.target.value = ""
  }

  function retakeImage() {
    setSelectedImage(null)
    setInputMethod(null)
    setImageEdit(defaultImageEdit)
    setInitialFaceBox(null)
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
    setInitialFaceBox(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    setCurrentStep("capture")
  }

  function goBack() {
    // No "capture" branch: capture (merged with consent, and now also with
    // review/editing) is the first step, so there's nowhere to go back to
    // from it — the Back button is hidden for this step (see the nav
    // render below) rather than this function needing a no-op case.
    // Processing -> capture deliberately leaves selectedImage untouched
    // (only retakeImage/removeImage clear it), so landing back on
    // "capture" with an image still set shows the editor again, not the
    // live camera/upload picker — the same effective destination the old
    // processing -> review transition landed on.
    if (currentStep === "processing") setCurrentStep("capture")
    if (currentStep === "results") setCurrentStep("processing")
  }

  async function goNext() {
    if (currentStep === "capture" && selectedImage) await analyzeSelectedImage()
    if (currentStep === "processing") setCurrentStep("results")
  }

  function restart() {
    stopCamera()
    setSelectedImage(null)
    setSelectedFileName("aurora-skin-scan.jpg")
    setImageEdit(defaultImageEdit)
    setInitialFaceBox(null)
    setInputMethod(null)
    setCameraError(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setReportDownloadUrl(null)
    setReportId(null)
    setClimateUsed(null)
    // Starting a new scan is its own fresh "visit" for location-freshness
    // purposes even though the component itself never remounts here — a
    // user could sit on the Results page for a while before starting
    // another scan, so this re-checks rather than trusting however-old
    // coords from the last one. Consent has nothing to reset: it's a
    // one-time, per-account acknowledgment now (see
    // app/(onboarding)/onboarding/consent), never asked again per scan.
    void checkLocation()
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
      setInitialFaceBox(null)
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
    <div
      className="flex min-h-svh flex-col bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px]"
    >
      {/* Genuinely pinned now (position: sticky), not just the first thing
          in the scrolling body — the Upload/Camera/Advice tabs and a real
          Dashboard link (always /dashboard, replacing the old plain "Exit"
          link that went to the marketing homepage) live here so they're
          visible at any scroll position. Adapted from wyasyn/review's
          components/scan/scan-capture-header.tsx + scan-flow-header.tsx +
          scan-close-button.tsx layout (git fetched and read in full) —
          review's actual resolved design drops a separate "Exit" concept
          entirely in favor of one Dashboard link, which this follows. */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-[1340px] items-center justify-between gap-3 px-8">
          <Link
            href="/dashboard"
            className="flex min-w-0 shrink items-center gap-2 text-foreground transition-colors hover:text-muted-foreground"
          >
            <AuroraLogomark className="size-5 shrink-0" />
            <span className="truncate font-heading text-sm font-medium tracking-wide">
              Aurora Organics
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted p-1">
            <TabButton
              active={activeTab === "upload"}
              onClick={() => selectTab("upload")}
            >
              <IconUpload className="size-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabButton>
            <TabButton
              active={activeTab === "camera"}
              onClick={() => selectTab("camera")}
            >
              <IconCamera className="size-4" />
              <span className="hidden sm:inline">Camera</span>
            </TabButton>
            <TabButton
              active={activeTab === "advice"}
              onClick={() => selectTab("advice")}
            >
              <IconMessageCircle className="size-4" />
              <span className="hidden sm:inline">Advice</span>
            </TabButton>
          </div>

          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/dashboard">
              <IconLayoutDashboard className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1340px] flex-1 px-8 py-10">
        <div className="grid gap-8">
          {activeTab === "advice" ? (
            <SkinAdviceChat />
          ) : (
            <>
              <StepIndicator currentStep={currentStep} />

              <section
                className={cn(
                  "grid gap-8",
                  // Second column always shows something real now — the
                  // always-visible Tips panel during "capture" (live camera/
                  // upload picker, and the merged editing sub-state), or the
                  // existing ScanPreview once past it — so this is
                  // unconditionally 2-column instead of a per-step ternary.
                  // Fixed 360px right column (reference: ~350-380px tips
                  // panel) instead of a fractional ratio, so the left card
                  // settles at ~948px on this 1340px container (reference:
                  // ~900-950px content card) rather than stretching with
                  // viewport width like the old 1.1fr/0.9fr split did.
                  "lg:grid-cols-[1fr_360px]"
                )}
              >
                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                  {/* Consent is guaranteed by the time this component ever
                  renders (see this file's top comment), and location's
                  silent re-check means there's nothing to show here when
                  it's fine — so this header is now the same for every
                  sub-state of this step (live capture, in-place editing,
                  processing, results) instead of a per-state ternary,
                  which is also what makes the merged capture+review step
                  read as a continuation of one page rather than a jump to
                  a different screen. */}
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
                    <IconSparkles className="size-4" />
                    Aurora Organics
                  </p>
                  <h1 className="font-heading text-3xl font-semibold tracking-normal">
                    {copy.title}
                  </h1>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {copy.description}
                  </p>

                  <div className="mt-8">
                    {currentStep === "capture" && !selectedImage ? (
                      // Single centered column now that consent (moved to
                      // signup, see app/(onboarding)/onboarding/consent)
                      // and the old always-on location gate box (replaced
                      // by a silent re-check + failure-only banner) are
                      // both gone — nothing left to split into a second
                      // column here.
                      <div className="grid gap-5">
                        <LocationFailureBanner status={locationStatus} onRetry={() => void checkLocation()} />
                        <CaptureStep
                          method={activeTab}
                          videoRef={videoRef}
                          canvasRef={canvasRef}
                          fileInputRef={fileInputRef}
                          cameraError={cameraError}
                          isCameraActive={isCameraActive}
                          locationGranted={locationStatus === "granted"}
                          scansExhausted={scansExhausted}
                          qualitySnapshot={qualitySnapshot}
                          landmarkerStatus={landmarkerStatus}
                          faceBox={faceBox}
                          videoDimensions={videoDimensions}
                          devices={devices}
                          activeDeviceId={activeDeviceId}
                          activeDeviceLabel={getDeviceLabel(devices, activeDeviceId)}
                          switchingCamera={switchingCamera}
                          onStartCamera={() => void startCamera()}
                          onCapture={captureImage}
                          onUpload={uploadImage}
                          onDropFile={handleSelectedFile}
                          onSelectDevice={(deviceId) => void selectDevice(deviceId)}
                        />
                      </div>
                    ) : null}
                    {currentStep === "capture" && selectedImage ? (
                      <ReviewStep
                        selectedImage={selectedImage}
                        inputMethod={inputMethod}
                        imageEdit={imageEdit}
                        initialFaceBox={initialFaceBox}
                        onEditChange={setImageEdit}
                        onResetEdit={() => setImageEdit(defaultImageEdit)}
                        onRetake={retakeImage}
                        onRemove={removeImage}
                        onContinue={() => void goNext()}
                      />
                    ) : null}
                    {currentStep === "processing" ? (
                      <ProcessingStep
                        analysisError={analysisError}
                        isAnalyzing={isAnalyzing}
                      />
                    ) : null}
                    {currentStep === "results" ? (
                      <ResultsStep
                        analysis={analysisResult}
                        climate={climateUsed}
                      />
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
                            if (!reportDownloadUrl) return
                            // A real navigation (not window.open, which flashes
                            // an extra blank tab), so the browser applies the
                            // download route's Content-Disposition: attachment
                            // header as intended — `download` left empty lets
                            // the header's own filename win.
                            const link = document.createElement("a")
                            link.href = reportDownloadUrl
                            link.download = ""
                            document.body.appendChild(link)
                            link.click()
                            link.remove()
                          }}
                        >
                          <IconDownload className="size-4" />
                          Download PDF
                        </Button>
                      </>
                    ) : currentStep === "capture" ? null : (
                      // Only "processing" ever reaches this branch now (capture
                      // and results are both handled above) — the button always
                      // means "advance to Results" here, never "advance to
                      // Processing" (that transition now happens from
                      // ReviewStep's own Continue button once an image exists).
                      <Button
                        type="button"
                        onClick={() => void goNext()}
                        disabled={isAnalyzing || !analysisResult}
                      >
                        {isAnalyzing ? "Analyzing..." : "View Results"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid content-start gap-4">
                  {currentStep === "capture" ? (
                    <ScanCaptureTips />
                  ) : (
                    <ScanPreview
                      currentStep={currentStep}
                      selectedImage={selectedImage}
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// Pill-style segmented control (reference: rounded container, active tab
// filled with the primary color and white text, inactive tabs plain text +
// icon) — previously an underline-tab style that never matched the
// reference at all, not something a stale dev server would explain.
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
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
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

  // Scales the source image to COVER the canvas (fills the frame
  // completely, cropping any excess) before any user zoom is applied, so
  // `edit.zoom` is relative to "fill the frame", not to the image's raw
  // pixel size. Matches the ReviewStep preview's `object-cover` above —
  // must stay in sync, or what the user sees while positioning/zooming
  // won't match what actually gets baked and uploaded.
  //
  // Previously this used Math.min ("fit inside", leaving the untouched
  // canvas background visible in any gap) — for any source aspect ratio
  // other than exactly 4:5 (i.e. almost every real camera/webcam capture),
  // that left a large solid-white border baked into the final image, which
  // was skewing the lighting check's average-luminance reading well past
  // "too bright" regardless of the actual photo's exposure — confirmed on
  // a real capture where the false white border alone added +61 to the
  // reported average (204 measured vs. 143 for the real photo content).
  // Math.max ("cover") means the drawn image always fully covers the
  // canvas, so this class of false-positive white padding can no longer
  // happen for the default (unrotated) case.
  const baseScale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight
  )
  const drawWidth = image.naturalWidth * baseScale
  const drawHeight = image.naturalHeight * baseScale

  // Still needed as a fallback: a 90°/270° user rotation on a
  // width-or-height-constrained cover-fit image can expose small corner
  // gaps at the canvas edges (a manual, opt-in edit, unlike the default
  // case above) — white keeps that rare remainder consistent with the
  // rest of the app's plain background rather than leaving it transparent.
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
// stream than none. An explicit `deviceId` (from the multi-camera picker)
// takes priority over the facingMode preference — the user picked a
// specific device, so that choice wins over the "front camera" default.
async function requestCameraStream(deviceId?: string) {
  const preferredConstraints: MediaStreamConstraints = {
    audio: false,
    video: deviceId
      ? {
          deviceId: { exact: deviceId },
          height: { ideal: 960 },
          width: { ideal: 1280 },
        }
      : {
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
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
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
