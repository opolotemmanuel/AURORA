"use client"

import { useEffect, useState } from "react"
import { IconCamera, IconUpload } from "@tabler/icons-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { ScanCameraView } from "@/components/scan/scan-camera-view"
import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { ScanUploadPanel } from "@/components/scan/scan-upload-panel"
import type { CaptureMode } from "@/lib/scan/types"

type ScanCapturePanelProps = {
  mode: CaptureMode
  onModeChange: (mode: CaptureMode) => void
  onImageSelected: (file: File, previewUrl: string) => void
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
        onCapture={onImageSelected}
        onSwitchToUpload={() => onModeChange("upload")}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl rounded-[2rem] border border-border bg-background p-3">
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as CaptureMode)}
        variant="segment"
      >
        <div className="mb-3 space-y-2 px-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="font-heading text-sm font-semibold text-foreground">
              Capture your photo
            </p>

            <TabsList className="w-fit shrink-0 self-start sm:self-center">
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
          </div>

          <p className="text-xs text-muted-foreground">
            Upload a photo or use your camera
          </p>
        </div>

        <TabsContent value="upload" className="mt-0">
          <ScanUploadPanel onImageSelected={onImageSelected} />
        </TabsContent>
        <TabsContent value="camera" className="mt-0">
          {mode === "camera" ? (
            <ScanCameraView onCapture={onImageSelected} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
