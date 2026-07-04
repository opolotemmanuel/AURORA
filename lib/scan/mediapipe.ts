"use client"

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision"

import type { FaceDetection } from "@/lib/scan/types"

type ImageSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap

const VIDEO_FRAME_MS = 33

let imageDetectorPromise: Promise<FaceDetector> | null = null
let videoDetector: FaceDetector | null = null
let videoDetectorPromise: Promise<FaceDetector> | null = null
let nextVideoTimestampMs = 0

export function resetVideoFaceDetector() {
  if (videoDetector) {
    videoDetector.close()
    videoDetector = null
  }
  videoDetectorPromise = null
  nextVideoTimestampMs = 0
}

function bumpVideoTimestamp() {
  nextVideoTimestampMs += VIDEO_FRAME_MS
  return nextVideoTimestampMs
}

async function getImageFaceDetector(): Promise<FaceDetector> {
  if (!imageDetectorPromise) {
    imageDetectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      )

      return FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      })
    })()
  }

  return imageDetectorPromise
}

async function getVideoFaceDetector(): Promise<FaceDetector> {
  if (!videoDetectorPromise) {
    videoDetectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      )

      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5,
      })

      videoDetector = detector
      return detector
    })()
  }

  return videoDetectorPromise
}

function mapDetections(
  detections: ReturnType<FaceDetector["detect"]>["detections"],
): FaceDetection[] {
  return detections.map((detection) => {
    const box = detection.boundingBox
    return {
      x: box?.originX ?? 0,
      y: box?.originY ?? 0,
      width: box?.width ?? 0,
      height: box?.height ?? 0,
      confidence: detection.categories[0]?.score ?? 0,
    }
  })
}

async function detectFacesInVideo(
  source: HTMLVideoElement,
): Promise<FaceDetection[]> {
  const run = async () => {
    const detector = await getVideoFaceDetector()
    const result = detector.detectForVideo(source, bumpVideoTimestamp())
    return mapDetections(result.detections)
  }

  try {
    return await run()
  } catch {
    resetVideoFaceDetector()
    try {
      return await run()
    } catch {
      return []
    }
  }
}

export async function detectFaces(
  source: ImageSource,
): Promise<FaceDetection[]> {
  if (source instanceof HTMLVideoElement) {
    if (source.videoWidth === 0 || source.videoHeight === 0) {
      return []
    }

    return detectFacesInVideo(source)
  }

  const detector = await getImageFaceDetector()
  const result = detector.detect(source)
  return mapDetections(result.detections)
}
