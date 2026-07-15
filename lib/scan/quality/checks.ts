// Pure, landmark-based quality checks — every function here takes an
// already-computed FaceLandmarkerResult (or plain video dimensions) and
// returns a QualityCheckResult. No browser/canvas APIs, no React — kept
// testable and independent of the sampling loop that calls them (see
// components/scan/ScanFlow.tsx).
//
// All thresholds below are a first-pass calibration, same caveat as
// lib/scan/lighting.ts's original thresholds — expect adjustment after
// real-device testing (this file's own comments record what evidence, if
// any, backs each number at the time it was set).
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision"

import type { LightingBand } from "@/lib/scan/lighting"
import type { QualityCheckId, QualityCheckResult, QualityStatus } from "./types"

type Point = { x: number; y: number; z?: number }

function gate(id: QualityCheckId, status: QualityStatus, label: string, message: string): QualityCheckResult {
  return { id, severity: "gate", status, label, message }
}

function warning(id: QualityCheckId, status: QualityStatus, label: string, message: string): QualityCheckResult {
  return { id, severity: "warning", status, label, message }
}

// ---------------------------------------------------------------------------
// Face count
// ---------------------------------------------------------------------------

export function evaluateFaceCount(result: FaceLandmarkerResult): QualityCheckResult {
  const count = result.faceLandmarks.length

  if (count === 0) {
    return gate("faceCount", "fail", "Face detected", "No face detected — center your face in the frame.")
  }
  if (count > 1) {
    return gate("faceCount", "fail", "Face detected", "Multiple faces detected — make sure only you are in frame.")
  }
  return gate("faceCount", "pass", "Face detected", "One face detected.")
}

// ---------------------------------------------------------------------------
// Face position (also the basis for skinVisibility below)
// ---------------------------------------------------------------------------

export type FaceBoundingBox = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export function computeFaceBoundingBox(landmarks: Point[]): FaceBoundingBox {
  let minX = 1
  let maxX = 0
  let minY = 1
  let maxY = 0

  for (const point of landmarks) {
    if (point.x < minX) minX = point.x
    if (point.x > maxX) maxX = point.x
    if (point.y < minY) minY = point.y
    if (point.y > maxY) maxY = point.y
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

// "Occupying roughly 60-75% of the guide frame" per spec, measured as the
// face bounding box's height against the full video frame height (landmark
// y is already normalized 0-1 against the real captured frame, independent
// of how CSS's object-cover crops the on-screen preview). A wider pass band
// than the literal 60-75% avoids the check flickering pass/fail on tiny
// natural movement; the 60-75% "ideal" range only matters for which
// directional hint is shown, not for pass/fail itself.
// Exported so the live position-guide overlay (components/scan/
// FacePositionOverlay.tsx) can draw the target zone from these exact
// numbers instead of a separately hand-tuned set of UI constants that could
// drift out of sync with what this function actually checks.
export const FACE_HEIGHT_MIN = 0.5
export const FACE_HEIGHT_MAX = 0.85
export const CENTER_TOLERANCE = 0.12
export const EDGE_MARGIN = 0.03

export function evaluateFacePosition(landmarks: Point[]): QualityCheckResult {
  const box = computeFaceBoundingBox(landmarks)
  const offsetX = box.centerX - 0.5
  const offsetY = box.centerY - 0.5

  const touchesEdge = box.minX < EDGE_MARGIN || box.maxX > 1 - EDGE_MARGIN || box.minY < EDGE_MARGIN || box.maxY > 1 - EDGE_MARGIN
  if (touchesEdge) {
    return gate("facePosition", "fail", "Face position", "Move back slightly — your face is too close to the edge of the frame.")
  }

  if (box.height > FACE_HEIGHT_MAX) {
    return gate("facePosition", "fail", "Face position", "Move back a little so your whole face fits in the guide.")
  }
  if (box.height < FACE_HEIGHT_MIN) {
    return gate("facePosition", "fail", "Face position", "Move closer — your face is too small in the frame.")
  }

  if (Math.abs(offsetX) > CENTER_TOLERANCE) {
    return gate("facePosition", "fail", "Face position", offsetX > 0 ? "Move left to center your face." : "Move right to center your face.")
  }
  if (Math.abs(offsetY) > CENTER_TOLERANCE) {
    return gate("facePosition", "fail", "Face position", offsetY > 0 ? "Move up to center your face." : "Move down to center your face.")
  }

  return gate("facePosition", "pass", "Face position", "Face is centered and well framed.")
}

// ---------------------------------------------------------------------------
// Eye visibility
// ---------------------------------------------------------------------------

// Canonical MediaPipe Face Mesh indices (stable since the original 468-point
// topology; FaceLandmarker's 478 points preserve them in the same order) —
// widely documented eye-corner/lid landmarks used for eye-aspect-ratio (EAR)
// style blink/occlusion detection.
const RIGHT_EYE = { outer: 33, inner: 133, top: 159, bottom: 145 }
const LEFT_EYE = { outer: 362, inner: 263, top: 386, bottom: 374 }

// Below the widely-cited ~0.2 EAR blink threshold from Soukupová & Čech's
// eye-aspect-ratio work — set conservatively low (only the geometric
// fallback path when blendshapes are unavailable) so a normal blink isn't
// mistaken for occlusion; the calling hook additionally requires this to
// persist across several samples before actually gating (see ScanFlow.tsx).
const EAR_CLOSED_THRESHOLD = 0.15
const BLENDSHAPE_CLOSED_THRESHOLD = 0.6

function eyeAspectRatio(landmarks: Point[], eye: typeof RIGHT_EYE): number {
  const outer = landmarks[eye.outer]
  const inner = landmarks[eye.inner]
  const top = landmarks[eye.top]
  const bottom = landmarks[eye.bottom]
  if (!outer || !inner || !top || !bottom) return 1 // insufficient data — don't false-fail

  const width = Math.hypot(outer.x - inner.x, outer.y - inner.y)
  const height = Math.hypot(top.x - bottom.x, top.y - bottom.y)
  return width > 0 ? height / width : 1
}

export function evaluateEyeVisibility(result: FaceLandmarkerResult): QualityCheckResult {
  const landmarks = result.faceLandmarks[0]
  if (!landmarks) return gate("eyeVisibility", "fail", "Eyes visible", "No face detected.")

  const blendshapes = result.faceBlendshapes?.[0]?.categories
  if (blendshapes?.length) {
    const leftBlink = blendshapes.find((c) => c.categoryName === "eyeBlinkLeft")?.score ?? 0
    const rightBlink = blendshapes.find((c) => c.categoryName === "eyeBlinkRight")?.score ?? 0
    const bothClosed = leftBlink > BLENDSHAPE_CLOSED_THRESHOLD && rightBlink > BLENDSHAPE_CLOSED_THRESHOLD
    if (bothClosed) {
      return gate("eyeVisibility", "fail", "Eyes visible", "Both eyes need to be visible and open — remove sunglasses or hair covering your eyes.")
    }
    return gate("eyeVisibility", "pass", "Eyes visible", "Both eyes are visible.")
  }

  // Geometric fallback if blendshapes weren't returned for some reason.
  const rightEAR = eyeAspectRatio(landmarks, RIGHT_EYE)
  const leftEAR = eyeAspectRatio(landmarks, LEFT_EYE)
  const bothClosed = rightEAR < EAR_CLOSED_THRESHOLD && leftEAR < EAR_CLOSED_THRESHOLD
  if (bothClosed) {
    return gate("eyeVisibility", "fail", "Eyes visible", "Both eyes need to be visible and open — remove sunglasses or hair covering your eyes.")
  }
  return gate("eyeVisibility", "pass", "Eyes visible", "Both eyes are visible.")
}

// ---------------------------------------------------------------------------
// Face rotation (yaw/pitch/roll) — SOFT WARNING ONLY, per spec
// ---------------------------------------------------------------------------

// Standard rotation-matrix -> Euler angle decomposition (extrinsic X-Y-Z
// convention), applied to the 3x3 upper-left of MediaPipe's 4x4 facial
// transformation matrix. `data` is assumed row-major (data[row*4+col]) —
// flagged for real-device verification: if yaw/pitch readings look
// inverted or swapped once tested against an actual turned head, swap the
// row/column indices below rather than the thresholds.
const YAW_WARN_THRESHOLD_DEG = 20
const PITCH_WARN_THRESHOLD_DEG = 18
const ROLL_WARN_THRESHOLD_DEG = 15

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

export function evaluateFaceRotation(result: FaceLandmarkerResult): QualityCheckResult {
  const matrix = result.facialTransformationMatrixes?.[0]?.data
  if (!matrix || matrix.length < 16) {
    return warning("faceRotation", "pass", "Facing forward", "Look straight ahead.")
  }

  const r00 = matrix[0]
  const r10 = matrix[4]
  const r20 = matrix[8]
  const r21 = matrix[9]
  const r22 = matrix[10]

  const pitch = toDegrees(Math.atan2(r21, r22))
  const yaw = toDegrees(Math.atan2(-r20, Math.hypot(r21, r22)))
  const roll = toDegrees(Math.atan2(r10, r00))

  if (Math.abs(yaw) > YAW_WARN_THRESHOLD_DEG) {
    return warning("faceRotation", "warn", "Facing forward", "Turn your head to look straight at the camera.")
  }
  if (Math.abs(pitch) > PITCH_WARN_THRESHOLD_DEG) {
    return warning("faceRotation", "warn", "Facing forward", "Tilt your head to look straight at the camera.")
  }
  if (Math.abs(roll) > ROLL_WARN_THRESHOLD_DEG) {
    return warning("faceRotation", "warn", "Facing forward", "Straighten your head — it looks tilted sideways.")
  }
  return warning("faceRotation", "pass", "Facing forward", "Facing the camera straight on.")
}

// ---------------------------------------------------------------------------
// Occlusion — SOFT WARNING ONLY, deliberately generic per spec ("this
// classification is unreliable"). Only a coarse geometric proxy: eye and
// mouth region "openness" far outside plausible proportions can indicate
// the model is guessing at a covered region, but this is approximate by
// design — it never tries to name what's covering the face.
// ---------------------------------------------------------------------------

const MOUTH_TOP = 13
const MOUTH_BOTTOM = 14
const MOUTH_LEFT = 61
const MOUTH_RIGHT = 291

export function evaluateOcclusion(result: FaceLandmarkerResult): QualityCheckResult {
  const landmarks = result.faceLandmarks[0]
  if (!landmarks) return warning("occlusion", "pass", "Face fully visible", "")

  const box = computeFaceBoundingBox(landmarks)
  const mouthTop = landmarks[MOUTH_TOP]
  const mouthBottom = landmarks[MOUTH_BOTTOM]
  const mouthLeft = landmarks[MOUTH_LEFT]
  const mouthRight = landmarks[MOUTH_RIGHT]

  if (!mouthTop || !mouthBottom || !mouthLeft || !mouthRight || box.height === 0) {
    return warning("occlusion", "pass", "Face fully visible", "")
  }

  // A mouth landmark cluster that's essentially a single point relative to
  // face size (near-zero spread) is the signature of the model falling
  // back to a generic/interpolated placement — a real, unobstructed mouth
  // always has some measurable width and height at any expression.
  const mouthWidth = Math.hypot(mouthLeft.x - mouthRight.x, mouthLeft.y - mouthRight.y) / box.height
  const mouthHeight = Math.hypot(mouthTop.x - mouthBottom.x, mouthTop.y - mouthBottom.y) / box.height

  if (mouthWidth < 0.05 || mouthHeight < 0.005) {
    return warning("occlusion", "warn", "Face fully visible", "Part of your face may be covered — make sure your whole face is visible.")
  }

  return warning("occlusion", "pass", "Face fully visible", "Your face appears fully visible.")
}

// ---------------------------------------------------------------------------
// Expression — SOFT WARNING ONLY, generous threshold (only trips on an
// obvious big smile/expression, per spec's "known false-positive risk").
// ---------------------------------------------------------------------------

const EXPRESSION_WARN_THRESHOLD = 0.6

export function evaluateExpression(result: FaceLandmarkerResult): QualityCheckResult {
  const categories = result.faceBlendshapes?.[0]?.categories
  if (!categories?.length) return warning("expression", "pass", "Relaxed expression", "")

  const smile = Math.max(
    categories.find((c) => c.categoryName === "mouthSmileLeft")?.score ?? 0,
    categories.find((c) => c.categoryName === "mouthSmileRight")?.score ?? 0
  )
  const jawOpen = categories.find((c) => c.categoryName === "jawOpen")?.score ?? 0

  if (smile > EXPRESSION_WARN_THRESHOLD || jawOpen > EXPRESSION_WARN_THRESHOLD) {
    return warning("expression", "warn", "Relaxed expression", "A relaxed, neutral expression works best for a consistent scan.")
  }
  return warning("expression", "pass", "Relaxed expression", "Expression looks relaxed.")
}

// ---------------------------------------------------------------------------
// Skin visibility — SOFT WARNING ONLY, derived from the same bounding box
// as facePosition (per spec), just reporting which edge is tight rather
// than gating on it.
// ---------------------------------------------------------------------------

const SKIN_EDGE_WARNING_MARGIN = 0.06

export function evaluateSkinVisibility(landmarks: Point[]): QualityCheckResult {
  const box = computeFaceBoundingBox(landmarks)

  if (box.minY < SKIN_EDGE_WARNING_MARGIN) {
    return warning("skinVisibility", "warn", "Skin fully visible", "Your forehead looks close to the edge of frame.")
  }
  if (1 - box.maxY < SKIN_EDGE_WARNING_MARGIN) {
    return warning("skinVisibility", "warn", "Skin fully visible", "Your chin looks close to the edge of frame.")
  }
  if (box.minX < SKIN_EDGE_WARNING_MARGIN || 1 - box.maxX < SKIN_EDGE_WARNING_MARGIN) {
    return warning("skinVisibility", "warn", "Skin fully visible", "One cheek looks close to the edge of frame.")
  }
  return warning("skinVisibility", "pass", "Skin fully visible", "Forehead, cheeks, and chin all visible.")
}

// ---------------------------------------------------------------------------
// Resolution — trivial, no landmarks needed.
// ---------------------------------------------------------------------------

const MIN_DIMENSION = 480

export function evaluateResolution(videoWidth: number, videoHeight: number): QualityCheckResult {
  const shortEdge = Math.min(videoWidth, videoHeight)
  if (shortEdge < MIN_DIMENSION) {
    return gate("resolution", "fail", "Camera resolution", "Your camera resolution is too low for a reliable scan.")
  }
  return gate("resolution", "pass", "Camera resolution", "Camera resolution is sufficient.")
}

// ---------------------------------------------------------------------------
// Lighting / exposure — thin adapter over the existing shared band
// classifier (lib/scan/lighting.ts's classifyLuminance), reused unchanged
// rather than re-implemented here. That module already distinguishes
// "too_dark" (underexposed) from "too_bright" (overexposed) as separate
// band values, which is what the spec's separately-listed "exposure" bullet
// is asking for — this single checklist row covers both, so there's no
// second, duplicate over/under-exposure check anywhere else.
// ---------------------------------------------------------------------------

export function evaluateLighting(band: LightingBand): QualityCheckResult {
  if (band === "too_dark") {
    return gate("lighting", "fail", "Lighting", "Too dark — move to a brighter, more evenly lit area.")
  }
  if (band === "too_bright") {
    return gate("lighting", "fail", "Lighting", "Too bright or overexposed — reduce direct light or glare.")
  }
  return gate("lighting", "pass", "Lighting", "Lighting looks good.")
}
