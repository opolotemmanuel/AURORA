"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { IconCrop, IconFileText, IconRefresh } from "@tabler/icons-react"

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
  onReEdit?: () => void
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
  onReEdit,
  onViewReport,
  showActions = true,
  className,
}: ScanReportLayoutProps) {
  const showImageColumn = Boolean(imageSrc) || imageLoading

  return (
    <div className={cn("mx-auto w-full max-w-5xl space-y-4", className)}>
      {showActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onReEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReEdit}
              className="rounded-full"
            >
              <IconCrop className="size-3.5" />
              Adjust crop
            </Button>
          ) : null}
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

      <div
        className={cn(
          "grid w-full items-start gap-6",
          showImageColumn &&
            "justify-items-center lg:grid-cols-[minmax(0,280px)_1fr] lg:justify-items-stretch lg:gap-8",
        )}
      >
        {showImageColumn ? (
          <div className="mx-auto w-full max-w-[280px] self-start lg:sticky lg:top-8 lg:mx-0">
            <ScanImagePanel
              imageSrc={imageSrc}
              isLoading={imageLoading}
              loadingLabel={imageLoadingLabel}
              overlay={imageOverlay}
              compact
            />
          </div>
        ) : null}
        <div className="mx-auto min-w-0 w-full max-w-2xl self-start lg:mx-0 lg:max-w-none">
          {children}
        </div>
      </div>
    </div>
  )
}
