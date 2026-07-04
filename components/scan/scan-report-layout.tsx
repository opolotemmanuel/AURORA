"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { IconFileText, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ScanImagePanel } from "@/components/scan/scan-image-panel"
import { cn } from "@/lib/utils"

type ScanReportLayoutProps = {
  imageSrc?: string | null
  imageLoading?: boolean
  imageLoadingLabel?: string
  imageOverlay?: ReactNode
  children: ReactNode
  onRescan?: () => void
  onViewReport?: () => void
  showActions?: boolean
  className?: string
}

export function ScanReportLayout({
  imageSrc,
  imageLoading = false,
  imageLoadingLabel,
  imageOverlay,
  children,
  onRescan,
  onViewReport,
  showActions = true,
  className,
}: ScanReportLayoutProps) {
  return (
    <div className={cn("w-full max-w-5xl space-y-4", className)}>
      {showActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onRescan ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRescan}
              className="rounded-full"
            >
              <IconRefresh className="size-3.5" />
              Rescan
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          {onViewReport ? (
            <Button
              type="button"
              size="sm"
              onClick={onViewReport}
              className="rounded-full"
            >
              <IconFileText className="size-3.5" />
              View report
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <ScanImagePanel
          imageSrc={imageSrc}
          isLoading={imageLoading}
          loadingLabel={imageLoadingLabel}
          overlay={imageOverlay}
        />
        <div className="flex min-w-0 flex-col justify-center">{children}</div>
      </div>
    </div>
  )
}
