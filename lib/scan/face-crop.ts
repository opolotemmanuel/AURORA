// Adapted from wyasyn/aura's review branch's lib/scan/face-crop.ts
// (pickBestFaceCrop/computeFaceCropRect). Review computes a resizable crop
// *rectangle* from its own pixel-based FaceDetection shape and a second,
// separately-loaded face detector. This project already runs a MediaPipe
// FaceLandmarker for the quality gate (lib/scan/quality/face-landmarker.ts)
// and its output — lib/scan/quality/checks.ts's FaceBoundingBox — is already
// normalized (0-1) against the native captured frame, so no second model
// and no pixel-to-normalized conversion is needed here.
//
// This project's Review step (components/scan/ScanFlow.tsx) doesn't have a
// resizable crop rect at all — it has a fixed 4:5 pan/zoom/rotate/flip
// editor. So instead of producing a crop rectangle, this produces a
// starting pan offset that recenters that existing editor on the detected
// face, leaving the editor itself completely unchanged.
import type { FaceBoundingBox } from "@/lib/scan/quality/checks"

export type InitialImageEdit = {
  offsetX: number
  offsetY: number
  zoom: number
  rotation: number
  flipX: boolean
}

const CENTERED_DEFAULT: InitialImageEdit = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  rotation: 0,
  flipX: false,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// `imageWidth`/`imageHeight` are the captured frame's native pixel size
// (faceBox is normalized against this exact frame — see ScanFlow.tsx's
// captureImage). `containerWidth`/`containerHeight` are the Review step's
// actual rendered preview box, only knowable once it's mounted (see
// ReviewStep's effect) — this mirrors the browser's own object-cover math
// for that box's `<Image fill className="object-cover">`, so the computed
// offset lands exactly where the live preview shows it, not an
// approximation that could drift from what the user actually sees.
export function computeInitialImageEdit(
  faceBox: FaceBoundingBox | null,
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
): InitialImageEdit {
  if (!faceBox || imageWidth <= 0 || imageHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return CENTERED_DEFAULT
  }

  const baseScale = Math.max(containerWidth / imageWidth, containerHeight / imageHeight)
  const renderedWidth = imageWidth * baseScale
  const renderedHeight = imageHeight * baseScale

  const offsetX = -(faceBox.centerX - 0.5) * renderedWidth
  const offsetY = -(faceBox.centerY - 0.5) * renderedHeight

  // Never translate further than object-cover's own slack allows — beyond
  // this, empty container background would show through, which the
  // browser's default cover-fit never does on its own.
  const maxOffsetX = Math.max(0, (renderedWidth - containerWidth) / 2)
  const maxOffsetY = Math.max(0, (renderedHeight - containerHeight) / 2)

  return {
    offsetX: clamp(offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(offsetY, -maxOffsetY, maxOffsetY),
    zoom: 1,
    rotation: 0,
    flipX: false,
  }
}
