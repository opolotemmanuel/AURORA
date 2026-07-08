"use client"

import { useEffect, useState } from "react"

import { Tabs, TabsContent } from "@/components/motion/tabs"
import { ScanCameraHints } from "@/components/scan/scan-camera-hints"
import { ScanCameraView } from "@/components/scan/scan-camera-view"
import { ScanCaptureHeader } from "@/components/scan/scan-capture-header"
import { ScanCaptureAdvicePanel } from "@/components/scan/scan-capture-advice-panel"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { ScanUploadPanel } from "@/components/scan/scan-upload-panel"
import type { CaptureMode } from "@/lib/scan/types"
import { CAPTURE_COPY } from "@/lib/scan/capture-copy"

type ScanCapturePanelProps = {
  mode: CaptureMode
  onModeChange: (mode: CaptureMode) => void
  onImageSelected: (file: File, previewUrl: string, source: CaptureMode) => void
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
  onModeChange,
  onImageSelected,
}: ScanCapturePanelProps) {
  const isMobile = useIsMobile()
  const activeMode = mode === "live" ? "upload" : mode
  const copy = CAPTURE_COPY[activeMode]

  useEffect(() => {
    if (mode === "live") {
      onModeChange("upload")
    }
  }, [mode, onModeChange])

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
        value={activeMode}
        onValueChange={(value) => onModeChange(value as CaptureMode)}
        variant="segment"
        className="relative w-full max-w-2xl overflow-visible"
      >
        <ScanCaptureHeader />

        <div className="relative overflow-visible">
          {activeMode === "advice" ? (
            mode === "advice" ? <ScanCaptureAdvicePanel /> : null
          ) : (
            <ScanStepShell title={copy.title} description={copy.description}>
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
            </ScanStepShell>
          )}

          {mode === "camera" ? <ScanCameraHints placement="section" /> : null}
        </div>
      </Tabs>
    </div>
  )
}
