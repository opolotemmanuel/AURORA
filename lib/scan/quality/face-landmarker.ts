// Lazy-loading wrapper around @mediapipe/tasks-vision's FaceLandmarker.
// `@mediapipe/tasks-vision` is only ever dynamically imported here (never
// at module top-level), so it never enters the initial page bundle — the
// ~40KB gzip JS module, the ~10-11MB WASM runtime, and the ~3-4MB model
// file are only fetched the first time getFaceLandmarker() is actually
// called, i.e. once the Capture step of the scan flow is genuinely active
// (see components/scan/ScanFlow.tsx). All three are then cached by the
// browser's normal HTTP cache for the rest of the session (and across
// visits, since MediaPipe's CDN serves them with long-lived cache headers).
//
// WASM runtime and model both load from Google's own CDNs (the exact URLs
// from MediaPipe's official web setup docs), not self-hosted — this
// mirrors AGENTS.md's Image Rule intent (avoid hotlinking arbitrary third
// parties) less directly than it applies to a large, versioned ML runtime
// asset: self-hosting would mean manually keeping ~33MB of WASM binaries
// in sync with the installed package version. Using Google's documented
// CDN is the officially recommended path and avoids that maintenance
// burden; revisit if a fully offline/self-hosted deployment is required
// later.
import type { FaceLandmarker as FaceLandmarkerType, FaceLandmarkerResult } from "@mediapipe/tasks-vision"

const WASM_FILESET_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"

// At most 3: the UI only ever needs to distinguish "zero" / "one" /
// "more than one" faces — capping higher would cost extra inference time
// for no product benefit.
const MAX_FACES = 3

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null

export async function getFaceLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision")
      const vision = await FilesetResolver.forVisionTasks(WASM_FILESET_URL)

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: MAX_FACES,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      })
    })().catch((error) => {
      // Let the next call retry from scratch instead of permanently caching
      // a rejected promise (e.g. a transient CDN fetch failure shouldn't
      // permanently disable the checklist for the rest of the session).
      landmarkerPromise = null
      throw error
    })
  }

  return landmarkerPromise
}

export function detectFaces(
  landmarker: FaceLandmarkerType,
  video: HTMLVideoElement,
  timestampMs: number
): FaceLandmarkerResult {
  return landmarker.detectForVideo(video, timestampMs)
}

// Frees the WASM-side GPU/CPU resources — called when the Capture tab is
// no longer active (see ScanFlow.tsx) so a long-lived session on other
// tabs (Upload, Advice) or after leaving /scan entirely doesn't keep this
// heavy model resident in memory, particularly on mobile.
export async function disposeFaceLandmarker(): Promise<void> {
  if (!landmarkerPromise) return

  const promise = landmarkerPromise
  landmarkerPromise = null

  try {
    const landmarker = await promise
    landmarker.close()
  } catch {
    // Already failed to load — nothing to close.
  }
}

export type { FaceLandmarkerResult }
