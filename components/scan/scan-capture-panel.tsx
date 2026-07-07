"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Tabs, TabsContent } from "@/components/motion/tabs"
import { ScanCameraHints } from "@/components/scan/scan-camera-hints"
import { ScanCameraView } from "@/components/scan/scan-camera-view"
import { ScanCaptureHeader } from "@/components/scan/scan-capture-header"
import { ScanLivePanel } from "@/components/scan/scan-live-panel"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { ScanUploadPanel } from "@/components/scan/scan-upload-panel"
import type { CaptureMode, ScanTier } from "@/lib/scan/types"

type ScanCapturePanelProps = {
  mode: CaptureMode
  userScanTier: ScanTier
  onModeChange: (mode: CaptureMode) => void
  onImageSelected: (file: File, previewUrl: string, source: CaptureMode) => void
  onLiveComplete: (result: {
    transcript: string
    bestFrameBlob: Blob
    previewUrl: string
    sessionDurationMs: number
  }) => void
}

const CAPTURE_COPY: Record<
  CaptureMode,
  { title: string; description: string }
> = {
  upload: {
    title: "Upload your photo",
    description: "Choose a clear, well-lit photo of your face",
  },
  camera: {
    title: "Take a photo",
    description: "Position your face in the frame; we'll check lighting live",
  },
  live: {
    title: "Live scan",
    description: "Real-time guidance with Aurora Pro",
  },
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return isMobile
}

export function ScanCapturePanel({
  mode,
  userScanTier,
  onModeChange,
  onImageSelected,
  onLiveComplete,
}: ScanCapturePanelProps) {
  const isMobile = useIsMobile()
  const isPro = userScanTier === "pro"
  const copy = CAPTURE_COPY[mode]

  if (mode === "live" && isPro) {
    return (
      <ScanLivePanel
        onComplete={onLiveComplete}
        onCancel={() => onModeChange("upload")}
      />
    )
  }

  if (isMobile && mode === "camera") {
    return (
      <>
        <ScanCameraView
          fullscreen
          onCapture={(file, previewUrl) =>
            onImageSelected(file, previewUrl, "camera")
          }
          onSwitchToUpload={() => onModeChange("upload")}
        />
        <ScanCameraHints placement="fullscreen" />
      </>
    )
  }

  return (
    <div className="flex w-full flex-col items-center overflow-visible">
      <Tabs
        value={mode}
        onValueChange={(value) => {
          if (value === "live" && !isPro) {
            toast.info("Upgrade to Pro", {
              description:
                "Live scan is a Pro feature. Contact an admin to upgrade your account.",
            })
            return
          }
          onModeChange(value as CaptureMode)
        }}
        variant="segment"
        className="relative w-full max-w-2xl overflow-visible"
      >
        <ScanCaptureHeader isPro={isPro} />

        <div className="relative overflow-visible">
          <ScanStepShell
            title={copy.title}
            description={copy.description}
          >
            <TabsContent value="upload" className="mt-0">
              <ScanUploadPanel onImageSelected={onImageSelected} />
            </TabsContent>
            <TabsContent value="camera" className="mt-0">
              {mode === "camera" ? (
                <ScanCameraView
                  onCapture={(file, previewUrl) =>
                    onImageSelected(file, previewUrl, "camera")
                  }
                />
              ) : null}
            </TabsContent>
            <TabsContent value="live" className="mt-0">
              {mode === "live" && isPro ? (
                <ScanLivePanel
                  onComplete={onLiveComplete}
                  onCancel={() => onModeChange("upload")}
                />
              ) : (
                <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
                  Live scan is available on the Pro tier. Contact an admin to upgrade
                  your account.
                </div>
              )}
            </TabsContent>
          </ScanStepShell>

          {mode === "camera" ? <ScanCameraHints placement="section" /> : null}
        </div>
      </Tabs>
    </div>
  )
}
