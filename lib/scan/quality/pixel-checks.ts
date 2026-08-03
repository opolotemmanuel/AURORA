// Pure, canvas-pixel-based quality checks (blur, frame-to-frame stability,
// background busyness) — no landmarks, no browser APIs beyond plain
// typed-array math, so these run on the same downsampled grayscale buffer
// the caller already has (see components/scan/ScanFlow.tsx's sampling
// loop). Kept separate from checks.ts since these don't depend on
// @mediapipe/tasks-vision at all.
import type { QualityCheckResult } from "./types"

// Same luminance weights as lib/scan/lighting.ts, for consistency across
// every brightness/grayscale computation in this app.
export function toGrayscale(data: Uint8ClampedArray, channels: number): Float32Array {
  const pixelCount = data.length / channels
  const gray = new Float32Array(pixelCount)
  for (let i = 0, p = 0; i < data.length; i += channels, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return gray
}

// ---------------------------------------------------------------------------
// Sharpness — variance of the discrete Laplacian, the standard, widely-used
// "blur score" (equivalent to OpenCV's cv2.Laplacian(img, CV_64F).var()
// technique): a sharp image has strong, varied edge responses; a blurry one
// has weak, uniform ones. Threshold is a first-pass placeholder — flagged
// for real-device calibration, same as lib/scan/lighting.ts's original
// thresholds were.
// ---------------------------------------------------------------------------

const SHARPNESS_FAIL_THRESHOLD = 15

export function computeLaplacianVariance(gray: Float32Array, width: number, height: number): number {
  const responses: number[] = []
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const laplacian =
        4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width]
      responses.push(laplacian)
    }
  }

  if (responses.length === 0) return 0

  const mean = responses.reduce((sum, value) => sum + value, 0) / responses.length
  const variance = responses.reduce((sum, value) => sum + (value - mean) ** 2, 0) / responses.length
  return variance
}

export function evaluateSharpness(gray: Float32Array, width: number, height: number): QualityCheckResult {
  const variance = computeLaplacianVariance(gray, width, height)
  if (variance < SHARPNESS_FAIL_THRESHOLD) {
    return {
      id: "sharpness",
      severity: "gate",
      status: "fail",
      label: "Image sharpness",
      message: "Image looks blurry — hold the camera steady and make sure your face is in focus.",
    }
  }
  return { id: "sharpness", severity: "gate", status: "pass", label: "Image sharpness", message: "Image is sharp." }
}

// ---------------------------------------------------------------------------
// Stability — mean absolute frame-to-frame difference. The hook that owns
// consecutive samples (ScanFlow.tsx) decides how many stable samples in a
// row are required before treating the frame as genuinely stable (not just
// this one instant) and passes that boolean in here for message formatting.
// ---------------------------------------------------------------------------

const MOVEMENT_THRESHOLD = 6

export function computeFrameDifference(previous: Float32Array, current: Float32Array): number {
  if (previous.length !== current.length || previous.length === 0) return 0

  let total = 0
  for (let i = 0; i < current.length; i++) {
    total += Math.abs(current[i] - previous[i])
  }
  return total / current.length
}

export function isFrameMoving(diff: number): boolean {
  return diff > MOVEMENT_THRESHOLD
}

export function evaluateStability(isStable: boolean): QualityCheckResult {
  if (!isStable) {
    return {
      id: "stability",
      severity: "gate",
      status: "fail",
      label: "Camera steady",
      message: "Hold the camera still for a moment.",
    }
  }
  return { id: "stability", severity: "gate", status: "pass", label: "Camera steady", message: "Camera is steady." }
}

// ---------------------------------------------------------------------------
// Background busyness — SOFT WARNING ONLY. Standard deviation of pixel
// values outside the face bounding box; generous threshold since this is
// only ever a warning, not a gate, and background complexity is inherently
// a rough proxy for "plain vs. busy", not a precise measurement.
// ---------------------------------------------------------------------------

const BACKGROUND_BUSY_STD_DEV_THRESHOLD = 45

export function evaluateBackground(
  gray: Float32Array,
  width: number,
  height: number,
  faceBox: { minX: number; maxX: number; minY: number; maxY: number }
): QualityCheckResult {
  const values: number[] = []
  for (let y = 0; y < height; y++) {
    const normY = y / height
    for (let x = 0; x < width; x++) {
      const normX = x / width
      const insideFace = normX >= faceBox.minX && normX <= faceBox.maxX && normY >= faceBox.minY && normY <= faceBox.maxY
      if (insideFace) continue
      values.push(gray[y * width + x])
    }
  }

  if (values.length < 20) {
    return { id: "background", severity: "warning", status: "pass", label: "Plain background", message: "" }
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)

  if (stdDev > BACKGROUND_BUSY_STD_DEV_THRESHOLD) {
    return {
      id: "background",
      severity: "warning",
      status: "warn",
      label: "Plain background",
      message: "A plain, uncluttered background helps Aurora Organics focus on your skin.",
    }
  }
  return { id: "background", severity: "warning", status: "pass", label: "Plain background", message: "Background looks fine." }
}
