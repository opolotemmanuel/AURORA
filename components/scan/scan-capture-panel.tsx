"use client"

import { useEffect, useState } from "react"
import { IconRefresh } from "@tabler/icons-react"
import { toast } from "sonner"

import { Tabs, TabsContent } from "@/components/motion/tabs"
import { ScanCameraHints } from "@/components/scan/scan-camera-hints"
import { ScanCameraView } from "@/components/scan/scan-camera-view"
import { ScanCaptureHeader } from "@/components/scan/scan-capture-header"
import { ScanHeaderActionButton } from "@/components/scan/scan-header-action"
import { ScanLivePanel } from "@/components/scan/scan-live-panel"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { ScanUploadPanel } from "@/components/scan/scan-upload-panel"
import type { CaptureMode, ScanTier } from "@/lib/scan/types"
import { CAPTURE_COPY } from "@/lib/scan/capture-copy"

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
  const [liveHasError, setLiveHasError] = useState(false)
  const [liveSessionKey, setLiveSessionKey] = useState(0)

  useEffect(() => {
    if (mode !== "live") {
      setLiveHasError(false)
    }
  }, [mode])

  const handleLiveRetry = () => {
    setLiveHasError(false)
    setLiveSessionKey((key) => key + 1)
    onModeChange("upload")
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
        <ScanCaptureHeader
          isPro={isPro}
          trailingActions={
            liveHasError && mode === "live" ? (
              <ScanHeaderActionButton
                label="Retry"
                icon={<IconRefresh className="size-3.5" />}
                onClick={handleLiveRetry}
              />
            ) : null
          }
        />

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
                  key={liveSessionKey}
                  onComplete={onLiveComplete}
                  onCancel={() => onModeChange("upload")}
                  onErrorChange={setLiveHasError}
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
