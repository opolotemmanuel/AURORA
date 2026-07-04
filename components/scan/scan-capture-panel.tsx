"use client"

import { useEffect, useState } from "react"
import { IconCamera, IconUpload, IconVideo } from "@tabler/icons-react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { ScanCameraView } from "@/components/scan/scan-camera-view"
import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { ScanLivePanel } from "@/components/scan/scan-live-panel"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { ScanUploadPanel } from "@/components/scan/scan-upload-panel"
import { Badge } from "@/components/ui/badge"
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
            <TabsTrigger
              value="live"
              className="gap-1.5 px-3 data-[disabled=true]:opacity-50"
              data-disabled={!isPro}
            >
              <IconVideo className="size-3.5" />
              Live
              {!isPro ? (
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                  Pro
                </Badge>
              ) : (
                <Badge className="ml-1 hidden sm:inline-flex">Pro</Badge>
              )}
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
    </Tabs>
  )
}
