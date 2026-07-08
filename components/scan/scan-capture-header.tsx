"use client"

import type { ReactNode } from "react"
import { IconCamera, IconSparkles, IconUpload } from "@tabler/icons-react"

import { TabsList, TabsTrigger } from "@/components/motion/tabs"
import { ScanFlowHeader } from "@/components/scan/scan-flow-header"

type ScanCaptureHeaderProps = {
  trailingActions?: ReactNode
}

export function ScanCaptureHeader({ trailingActions }: ScanCaptureHeaderProps) {
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
            <TabsTrigger value="advice" className="gap-1.5 px-3">
              <IconSparkles className="size-3.5" />
              <span className="hidden sm:inline">Advice</span>
            </TabsTrigger>
          </TabsList>
          {trailingActions}
        </>
      }
    />
  )
}
