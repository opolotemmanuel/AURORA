"use client"

// Orchestrates the live pre-capture quality checklist: loads the face
// landmarker lazily (only once `active` is true — see ScanFlow.tsx, which
// only sets this while the Capture tab is genuinely showing a live camera
// feed), samples the video feed on an interval, runs every pure check from
// checks.ts/pixel-checks.ts, and rolls the results up via scoring.ts.
//
// Entirely client-side: nothing here ever calls fetch/the backend/Gemini —
// every input is the local <video> element, every output is local React
// state. Errors loading the model are surfaced as a distinct status rather
// than an infinite "loading" spinner, since silently blocking capture
// forever on a failed third-party asset load would be a real fairness
// problem (flagged in the PR report, not silently worked around here).
import { useEffect, useRef, useState } from "react"

import {
  evaluateEyeVisibility,
  evaluateExpression,
  evaluateFaceCount,
  evaluateFaceRotation,
  evaluateLighting,
  evaluateOcclusion,
  evaluateResolution,
  evaluateSkinVisibility,
  evaluateFacePosition,
  computeFaceBoundingBox,
  type FaceBoundingBox,
} from "./checks"
import { detectFaces, disposeFaceLandmarker, getFaceLandmarker } from "./face-landmarker"
import { classifyLuminance } from "@/lib/scan/lighting"
import {
  computeFrameDifference,
  evaluateBackground,
  evaluateSharpness,
  evaluateStability,
  isFrameMoving,
  toGrayscale,
} from "./pixel-checks"
import { computeQualitySnapshot } from "./scoring"
import type { QualityCheckResult, QualitySnapshot } from "./types"

const SAMPLE_INTERVAL_MS = 500
const SAMPLE_WIDTH = 96
const SAMPLE_HEIGHT = 72
// ~1s and ~1.5s of sustained bad readings (at the 500ms cadence above)
// before actually gating — long enough that a single blink or a brief
// hand-tremor frame-diff spike can't false-trigger a hard gate, short
// enough to still feel responsive.
const STABLE_STREAK_REQUIRED = 2
const EYES_CLOSED_STREAK_REQUIRED = 3

export type LandmarkerStatus = "idle" | "loading" | "ready" | "error"

export type VideoDimensions = { width: number; height: number }

export function useScanQuality(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean): {
  snapshot: QualitySnapshot | null
  landmarkerStatus: LandmarkerStatus
  // Raw (0-1, normalized against the native camera frame — same space
  // evaluateFacePosition itself uses) detected-face bounding box and the
  // frame's native pixel size, both updated every sample cycle. Consumed by
  // components/scan/FacePositionOverlay.tsx to draw the live position guide
  // in the exact coordinate space the check scores against, rather than a
  // separately hand-placed CSS shape.
  faceBox: FaceBoundingBox | null
  videoDimensions: VideoDimensions | null
} {
  const [snapshot, setSnapshot] = useState<QualitySnapshot | null>(null)
  const [landmarkerStatus, setLandmarkerStatus] = useState<LandmarkerStatus>("idle")
  const [faceBox, setFaceBox] = useState<FaceBoundingBox | null>(null)
  const [videoDimensions, setVideoDimensions] = useState<VideoDimensions | null>(null)

  const previousGrayRef = useRef<Float32Array | null>(null)
  const stableStreakRef = useRef(0)
  const eyesClosedStreakRef = useRef(0)
  const busyRef = useRef(false)
  // Interval callback below reads this instead of the `landmarkerStatus`
  // state directly — the effect deliberately doesn't re-run when that
  // state changes (see the comment at the bottom of this effect), so a
  // closed-over state value would stay stuck at whatever it was when the
  // interval was created. The ref is updated synchronously alongside every
  // setLandmarkerStatus call so the interval always sees the current value.
  const landmarkerStatusRef = useRef<LandmarkerStatus>("idle")

  useEffect(() => {
    if (!active) {
      setSnapshot(null)
      setLandmarkerStatus("idle")
      setFaceBox(null)
      setVideoDimensions(null)
      landmarkerStatusRef.current = "idle"
      previousGrayRef.current = null
      stableStreakRef.current = 0
      eyesClosedStreakRef.current = 0
      void disposeFaceLandmarker()
      return
    }

    let cancelled = false
    const sampleCanvas = document.createElement("canvas")
    sampleCanvas.width = SAMPLE_WIDTH
    sampleCanvas.height = SAMPLE_HEIGHT
    const context = sampleCanvas.getContext("2d", { willReadFrequently: true })

    setLandmarkerStatus("loading")
    landmarkerStatusRef.current = "loading"
    getFaceLandmarker()
      .then(() => {
        if (cancelled) return
        setLandmarkerStatus("ready")
        landmarkerStatusRef.current = "ready"
      })
      .catch(() => {
        if (cancelled) return
        setLandmarkerStatus("error")
        landmarkerStatusRef.current = "error"
      })

    const intervalId = window.setInterval(async () => {
      if (busyRef.current || cancelled) return
      const video = videoRef.current
      if (!video || !video.videoWidth || !video.videoHeight || !context) return

      busyRef.current = true
      try {
        // --- pixel-based checks (lighting, sharpness, stability, background) ---
        context.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
        const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
        const gray = toGrayscale(data, 4)

        let total = 0
        for (let i = 0; i < gray.length; i++) total += gray[i]
        const averageLuminance = total / gray.length
        const lightingResult = evaluateLighting(classifyLuminance(averageLuminance))

        const sharpnessResult = evaluateSharpness(gray, SAMPLE_WIDTH, SAMPLE_HEIGHT)

        const previous = previousGrayRef.current
        const diff = previous ? computeFrameDifference(previous, gray) : 0
        const moving = previous ? isFrameMoving(diff) : true // no baseline yet — treat as "still settling"
        stableStreakRef.current = moving ? 0 : stableStreakRef.current + 1
        const stabilityResult = evaluateStability(stableStreakRef.current >= STABLE_STREAK_REQUIRED)
        previousGrayRef.current = gray

        const resolutionResult = evaluateResolution(video.videoWidth, video.videoHeight)

        // --- landmark-based checks ---
        let faceCountResult: QualityCheckResult
        let facePositionResult: QualityCheckResult
        let eyeVisibilityResult: QualityCheckResult
        let rotationResult: QualityCheckResult
        let occlusionResult: QualityCheckResult
        let expressionResult: QualityCheckResult
        let skinVisibilityResult: QualityCheckResult
        let backgroundResult: QualityCheckResult
        let nextFaceBox: FaceBoundingBox | null = null

        if (landmarkerStatusRef.current === "error") {
          // The model never loaded — every landmark-dependent check stays
          // in an explicit failure state (never a silent false "pass")
          // rather than pretending detection ran.
          const unavailable = (id: QualityCheckResult["id"], severity: QualityCheckResult["severity"]): QualityCheckResult => ({
            id,
            severity,
            status: severity === "gate" ? "fail" : "pass",
            label: id,
            message: severity === "gate" ? "Face detection could not load — check your connection and reload the page." : "",
          })
          faceCountResult = unavailable("faceCount", "gate")
          facePositionResult = unavailable("facePosition", "gate")
          eyeVisibilityResult = unavailable("eyeVisibility", "gate")
          rotationResult = unavailable("faceRotation", "warning")
          occlusionResult = unavailable("occlusion", "warning")
          expressionResult = unavailable("expression", "warning")
          skinVisibilityResult = unavailable("skinVisibility", "warning")
          backgroundResult = evaluateBackground(gray, SAMPLE_WIDTH, SAMPLE_HEIGHT, { minX: 0.3, maxX: 0.7, minY: 0.2, maxY: 0.8 })
        } else {
          const landmarker = await getFaceLandmarker()
          const result = detectFaces(landmarker, video, performance.now())
          faceCountResult = evaluateFaceCount(result)

          const landmarks = result.faceLandmarks.length === 1 ? result.faceLandmarks[0] : null
          if (landmarks) {
            facePositionResult = evaluateFacePosition(landmarks)
            eyeVisibilityResult = evaluateEyeVisibility(result)
            rotationResult = evaluateFaceRotation(result)
            occlusionResult = evaluateOcclusion(result)
            expressionResult = evaluateExpression(result)
            skinVisibilityResult = evaluateSkinVisibility(landmarks)

            const eyesClosedNow = eyeVisibilityResult.status === "fail"
            eyesClosedStreakRef.current = eyesClosedNow ? eyesClosedStreakRef.current + 1 : 0
            if (eyesClosedStreakRef.current < EYES_CLOSED_STREAK_REQUIRED && eyesClosedNow) {
              // Not yet sustained long enough — treat as a normal blink, don't gate on it.
              eyeVisibilityResult = { ...eyeVisibilityResult, status: "pass" }
            }

            const box = computeFaceBoundingBox(landmarks)
            nextFaceBox = box
            backgroundResult = evaluateBackground(gray, SAMPLE_WIDTH, SAMPLE_HEIGHT, box)
          } else {
            const noFace = (id: QualityCheckResult["id"], severity: QualityCheckResult["severity"]): QualityCheckResult => ({
              id,
              severity,
              status: severity === "gate" ? "fail" : "pass",
              label: id,
              message: severity === "gate" ? "No single face detected." : "",
            })
            facePositionResult = noFace("facePosition", "gate")
            eyeVisibilityResult = noFace("eyeVisibility", "gate")
            rotationResult = noFace("faceRotation", "warning")
            occlusionResult = noFace("occlusion", "warning")
            expressionResult = noFace("expression", "warning")
            skinVisibilityResult = noFace("skinVisibility", "warning")
            backgroundResult = evaluateBackground(gray, SAMPLE_WIDTH, SAMPLE_HEIGHT, { minX: 0.3, maxX: 0.7, minY: 0.2, maxY: 0.8 })
            eyesClosedStreakRef.current = 0
          }
        }

        if (!cancelled) {
          setSnapshot(
            computeQualitySnapshot([
              faceCountResult,
              facePositionResult,
              lightingResult,
              sharpnessResult,
              stabilityResult,
              resolutionResult,
              eyeVisibilityResult,
              rotationResult,
              occlusionResult,
              expressionResult,
              backgroundResult,
              skinVisibilityResult,
            ])
          )
          setFaceBox(nextFaceBox)
          setVideoDimensions({ width: video.videoWidth, height: video.videoHeight })
        }
      } finally {
        busyRef.current = false
      }
    }, SAMPLE_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
    // landmarkerStatus intentionally omitted — re-running this effect on
    // every "loading" -> "ready" transition would tear down and restart
    // the sampling interval mid-flight; the interval callback reads the
    // latest status itself on each tick instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, videoRef])

  return { snapshot, landmarkerStatus, faceBox, videoDimensions }
}
