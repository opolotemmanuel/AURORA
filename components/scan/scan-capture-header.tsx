"use client"

import { IconCamera, IconUpload, IconVideo } from "@tabler/icons-react"

import { TabsList, TabsTrigger } from "@/components/motion/tabs"
import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { ScanFlowHeader } from "@/components/scan/scan-flow-header"
import { Badge } from "@/components/ui/badge"

type ScanCaptureHeaderProps = {
  isPro: boolean
}

export function ScanCaptureHeader({ isPro }: ScanCaptureHeaderProps) {
  return (
    <ScanFlowHeader
      trailing={
        <>
          <TabsList className="w-fit">
            <TabsTrigger value="upload" className="gap-1.5 px-3">
              <IconUpload className="size-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-1.5 px-3">
              <IconCamera className="size-3.5" />
              <span className="hidden sm:inline">Camera</span>
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className="gap-1.5 px-3 data-[disabled=true]:opacity-50"
              data-disabled={!isPro}
            >
              <IconVideo className="size-3.5" />
              <span className="hidden sm:inline">Live</span>
              {!isPro ? (
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                  Pro
                </Badge>
              ) : (
                <Badge className="ml-1 hidden sm:inline-flex">Pro</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <ScanDashboardLink variant="action" />
        </>
      }
    />
  )
}
