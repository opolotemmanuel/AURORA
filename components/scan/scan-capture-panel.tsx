"use client"

import { useEffect, useState } from "react"
import { IconCamera, IconUpload } from "@tabler/icons-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { ScanCameraView } from "@/components/scan/scan-camera-view"
import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { ScanUploadPanel } from "@/components/scan/scan-upload-panel"
import type { CaptureMode } from "@/lib/scan/types"

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

  if (isMobile && mode === "camera") {
    return (
      <ScanCameraView
        fullscreen
        onCapture={(file, previewUrl) =>
          onImageSelected(file, previewUrl, "camera")
        }
        onSwitchToUpload={() => onModeChange("upload")}
      />
    )
  }

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as CaptureMode)}
      variant="segment"
    >
      <ScanStepShell
        title="Capture your photo"
        description="Upload a photo or use your camera"
        headerTrailing={
          <TabsList className="w-fit">
            <TabsTrigger value="upload" className="gap-1.5 px-3">
              <IconUpload className="size-3.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-1.5 px-3">
              <IconCamera className="size-3.5" />
              Camera
            </TabsTrigger>
            <ScanDashboardLink variant="segment" />
          </TabsList>
        }
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
      </ScanStepShell>
    </Tabs>
  )
}
