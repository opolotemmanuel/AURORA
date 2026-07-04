"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { IconPlayerStop, IconSparkles, IconVideo } from "@tabler/icons-react"
import { GoogleGenAI } from "@google/genai"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { runQualityGate } from "@/lib/scan/quality-gate"
import type { QualityCheckResult } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ScanLivePanelProps = {
  onComplete: (result: {
    transcript: string
    bestFrameBlob: Blob
    previewUrl: string
    sessionDurationMs: number
  }) => void
  onCancel: () => void
}

const INITIAL_QUALITY: QualityCheckResult = {
  faceDetected: false,
  faceCount: 0,
  faceCentered: false,
  lightingScore: 0,
  lightingBand: "too_dark",
  isPlausibleSkin: false,
  issues: [],
  passed: false,
}

type LiveTokenResponse =
  | { ok: true; token: string; modelId: string; apiVersion: "v1alpha" }
  | { ok: false; error: string }

type LiveSessionHandle = {
  close: () => void
  sendRealtimeInput: (params: {
    video?: { data: string; mimeType: string }
  }) => void
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export function ScanLivePanel({ onComplete, onCancel }: ScanLivePanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef<LiveSessionHandle | null>(null)
  const transcriptRef = useRef<string[]>([])
  const bestFrameRef = useRef<Blob | null>(null)
  const startedAtRef = useRef<number>(0)
  const frameTimerRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusLabel, setStatusLabel] = useState("Connecting to live analysis…")
  const [quality, setQuality] = useState<QualityCheckResult>(INITIAL_QUALITY)
  const [transcriptPreview, setTranscriptPreview] = useState("")
  const [finishing, setFinishing] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const captureFrameBlob = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85)
    })
  }, [])

  const appendTranscript = useCallback((line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    transcriptRef.current.push(trimmed)
    setTranscriptPreview(transcriptRef.current.slice(-3).join(" "))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function startLiveSession() {
      try {
        const tokenResponse = await fetch("/api/scan/live/token", {
          method: "POST",
        })
        const tokenData = (await tokenResponse.json()) as LiveTokenResponse
        if (cancelled) return

        if (!tokenResponse.ok || !tokenData.ok) {
          setError(
            tokenData.ok ? "Could not start live scan." : tokenData.error,
          )
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        setReady(true)

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: tokenData.apiVersion },
        })

        const session = await ai.live.connect({
          model: tokenData.modelId,
          callbacks: {
            onopen: () => {
              if (cancelled) return
              setStreaming(true)
              setStatusLabel("Live scan active — hold still and face the camera")
              startedAtRef.current = Date.now()
            },
            onmessage: (message) => {
              const content = message.serverContent
              if (content?.outputTranscription?.text) {
                appendTranscript(content.outputTranscription.text)
              }
              if (content?.modelTurn?.parts) {
                for (const part of content.modelTurn.parts) {
                  if (part.text) appendTranscript(part.text)
                }
              }
            },
            onerror: (event) => {
              if (!cancelled) {
                setError(event.message || "Live scan connection error")
              }
            },
            onclose: () => {
              setStreaming(false)
            },
          },
        })

        if (cancelled) {
          session.close()
          return
        }

        sessionRef.current = session as LiveSessionHandle

        frameTimerRef.current = window.setInterval(() => {
          void (async () => {
            const videoEl = videoRef.current
            const liveSession = sessionRef.current
            if (!videoEl || !liveSession) return

            const blob = await captureFrameBlob()
            if (!blob) return

            try {
              const gate = await runQualityGate(videoEl)
              setQuality(gate)
              if (gate.passed || gate.faceDetected) {
                bestFrameRef.current = blob
              }
            } catch {
              // Quality hints are best-effort during live streaming
            }

            const arrayBuffer = await blob.arrayBuffer()
            liveSession.sendRealtimeInput({
              video: {
                data: bufferToBase64(arrayBuffer),
                mimeType: "image/jpeg",
              },
            })
          })()
        }, 1000)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not start live scan",
          )
        }
      }
    }

    void startLiveSession()

    return () => {
      cancelled = true
      if (frameTimerRef.current !== null) {
        window.clearInterval(frameTimerRef.current)
      }
      sessionRef.current?.close()
      stopStream()
    }
  }, [appendTranscript, captureFrameBlob, stopStream])

  const handleFinish = useCallback(async () => {
    setFinishing(true)
    setStatusLabel("Finalizing your live scan…")

    if (frameTimerRef.current !== null) {
      window.clearInterval(frameTimerRef.current)
    }
    sessionRef.current?.close()
    stopStream()

    const blob = bestFrameRef.current ?? (await captureFrameBlob())
    if (!blob) {
      setError("Could not capture a frame from your live scan.")
      setFinishing(false)
      return
    }

    const previewUrl = URL.createObjectURL(blob)
    onComplete({
      transcript: transcriptRef.current.join("\n"),
      bestFrameBlob: blob,
      previewUrl,
      sessionDurationMs: startedAtRef.current
        ? Date.now() - startedAtRef.current
        : 0,
    })
  }, [captureFrameBlob, onComplete, stopStream])

  return (
    <ScanStepShell
      title="Live scan"
      description="Pro — real-time cosmetic skin analysis via camera"
      headerTrailing={
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      }
    >
      <Alert>
        <AlertDescription>
          Cosmetic guidance only — not a medical diagnosis. Video frames are
          analyzed in memory and are not stored.
        </AlertDescription>
      </Alert>

      <div className="relative overflow-hidden rounded-[1.5rem] border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="mx-auto aspect-[3/4] h-[min(48svh,20rem)] w-full bg-muted object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex justify-between gap-2 p-3">
          <AnimatedBadge
            status={streaming ? "success" : error ? "danger" : "loading"}
            size="sm"
          >
            <IconVideo className="size-3.5" />
            {streaming ? "Live" : error ? "Error" : "Connecting"}
          </AnimatedBadge>
          {quality.passed ? (
            <AnimatedBadge status="success" size="sm">
              Face detected
            </AnimatedBadge>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{statusLabel}</p>

      {transcriptPreview ? (
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
            <IconSparkles className="size-4" />
            Live observations
          </div>
          <p className="text-muted-foreground">{transcriptPreview}</p>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Live scan unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="gap-2"
          disabled={!ready || finishing || Boolean(error)}
          onClick={() => void handleFinish()}
        >
          <IconPlayerStop className="size-4" />
          {finishing ? "Finishing…" : "Finish scan"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>

      <ul className="space-y-1 text-xs text-muted-foreground">
        <li className={cn(quality.faceDetected && "text-foreground")}>
          Keep one face centered in frame
        </li>
        <li className={cn(quality.lightingBand === "ok" && "text-foreground")}>
          Use even, natural lighting when possible
        </li>
      </ul>
    </ScanStepShell>
  )
}
