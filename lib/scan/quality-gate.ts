"use client"

import { detectFaces } from "@/lib/scan/mediapipe"
import type { LightingBand, QualityCheckResult } from "@/lib/scan/types"

type ImageSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap

const MIN_FACE_CONFIDENCE = 0.55
const MIN_FACE_AREA_RATIO = 0.08
const MAX_FACE_AREA_RATIO = 0.65
const MIN_LIGHTING = 0.22
const MAX_LIGHTING = 0.82
const MIN_WIDTH = 320
const MIN_HEIGHT = 320

function getSourceSize(source: ImageSource) {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight }
  }

  return { width: source.width, height: source.height }
}

function sampleLighting(
  source: ImageSource,
  face?: { x: number; y: number; width: number; height: number },
): { score: number; band: LightingBand } {
  const { width, height } = getSourceSize(source)
  if (width === 0 || height === 0) {
    return { score: 0, band: "too_dark" }
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return { score: 0, band: "too_dark" }
  }

  ctx.drawImage(source, 0, 0, width, height)

  const region = face ?? {
    x: width * 0.25,
    y: height * 0.15,
    width: width * 0.5,
    height: height * 0.7,
  }

  const sx = Math.max(0, Math.floor(region.x))
  const sy = Math.max(0, Math.floor(region.y))
  const sw = Math.min(width - sx, Math.floor(region.width))
  const sh = Math.min(height - sy, Math.floor(region.height))

  if (sw <= 0 || sh <= 0) {
    return { score: 0, band: "too_dark" }
  }

  const imageData = ctx.getImageData(sx, sy, sw, sh).data
  let total = 0
  let count = 0

  for (let i = 0; i < imageData.length; i += 16) {
    const r = imageData[i] ?? 0
    const g = imageData[i + 1] ?? 0
    const b = imageData[i + 2] ?? 0
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    total += luminance
    count += 1
  }

  const score = count > 0 ? total / count : 0
  let band: LightingBand = "ok"
  if (score < MIN_LIGHTING) band = "too_dark"
  if (score > MAX_LIGHTING) band = "too_bright"

  return { score, band }
}

function isFaceCentered(
  face: { x: number; y: number; width: number; height: number },
  width: number,
  height: number,
) {
  const centerX = face.x + face.width / 2
  const centerY = face.y + face.height / 2
  const dx = Math.abs(centerX - width / 2) / width
  const dy = Math.abs(centerY - height / 2) / height
  return dx < 0.18 && dy < 0.18
}

export async function runQualityGate(
  source: ImageSource,
  videoTimestampMs?: number,
): Promise<QualityCheckResult> {
  const { width, height } = getSourceSize(source)
  const issues: string[] = []

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    issues.push("Image resolution is too low for a reliable scan.")
  }

  let faces: Awaited<ReturnType<typeof detectFaces>> = []
  try {
    faces = await detectFaces(
      source,
      source instanceof HTMLVideoElement ? videoTimestampMs : undefined,
    )
  } catch {
    issues.push("Face detection is unavailable. Try again or upload a photo.")
  }

  const confidentFaces = faces.filter(
    (face) => face.confidence >= MIN_FACE_CONFIDENCE,
  )
  const faceDetected = confidentFaces.length === 1
  const primaryFace = confidentFaces[0]

  if (confidentFaces.length === 0) {
    issues.push("No face detected. Center your face in the guide.")
  } else if (confidentFaces.length > 1) {
    issues.push("Multiple faces detected. Only one person should be in frame.")
  }

  let faceCentered = false
  if (primaryFace && width > 0 && height > 0) {
    const areaRatio =
      (primaryFace.width * primaryFace.height) / (width * height)
    faceCentered = isFaceCentered(primaryFace, width, height)

    if (areaRatio < MIN_FACE_AREA_RATIO) {
      issues.push("Move closer so your face fills more of the frame.")
    }
    if (areaRatio > MAX_FACE_AREA_RATIO) {
      issues.push("Move back slightly so your full face is visible.")
    }
    if (!faceCentered) {
      issues.push("Center your face within the oval guide.")
    }
  }

  const { score: lightingScore, band: lightingBand } = sampleLighting(
    source,
    primaryFace,
  )

  if (lightingBand === "too_dark") {
    issues.push("Lighting is too dim. Face a window or brighter light.")
  }
  if (lightingBand === "too_bright") {
    issues.push("Lighting is too harsh. Avoid direct glare on your face.")
  }

  const isPlausibleSkin =
    faceDetected &&
    faceCentered &&
    lightingBand === "ok" &&
    width >= MIN_WIDTH &&
    height >= MIN_HEIGHT &&
    (primaryFace?.confidence ?? 0) >= MIN_FACE_CONFIDENCE

  const passed =
    faceDetected &&
    faceCentered &&
    lightingBand === "ok" &&
    isPlausibleSkin &&
    issues.length === 0

  return {
    faceDetected,
    faceCount: confidentFaces.length,
    faceCentered,
    lightingScore,
    lightingBand,
    isPlausibleSkin,
    issues,
    passed,
  }
}
