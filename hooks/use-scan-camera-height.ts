"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "aura:scan-camera-height"

export const SCAN_CAMERA_HEIGHT = {
  min: 200,
  default: 320,
  maxPx: 560,
  maxVh: 0.72,
} as const

function getMaxHeight() {
  if (typeof window === "undefined") return SCAN_CAMERA_HEIGHT.maxPx
  return Math.min(
    window.innerHeight * SCAN_CAMERA_HEIGHT.maxVh,
    SCAN_CAMERA_HEIGHT.maxPx,
  )
}

function clampHeight(value: number) {
  return Math.round(
    Math.min(getMaxHeight(), Math.max(SCAN_CAMERA_HEIGHT.min, value)),
  )
}

export function useScanCameraHeight() {
  const [height, setHeightState] = useState<number>(SCAN_CAMERA_HEIGHT.default)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const parsed = Number.parseInt(stored, 10)
    if (Number.isFinite(parsed)) {
      setHeightState(clampHeight(parsed))
    }
  }, [])

  const setHeight = useCallback((value: number) => {
    const next = clampHeight(value)
    setHeightState(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }, [])

  return { height, setHeight, clampHeight }
}
