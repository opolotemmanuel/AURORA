"use client"

import type { ReactNode } from "react"
import { IconCrop, IconFileText, IconRefresh } from "@tabler/icons-react"

import { ScanFlowHeader } from "@/components/scan/scan-flow-header"
import { ScanHeaderActionButton } from "@/components/scan/scan-header-action"
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
        <ScanFlowHeader
          className="max-w-5xl"
          trailing={
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              {onReEdit ? (
                <ScanHeaderActionButton
                  label="Adjust crop"
                  icon={<IconCrop className="size-3.5" />}
                  onClick={onReEdit}
                />
              ) : null}
              {onRescan ? (
                <ScanHeaderActionButton
                  label="Rescan"
                  icon={<IconRefresh className="size-3.5" />}
                  onClick={onRescan}
                />
              ) : null}
              {onViewReport ? (
                <ScanHeaderActionButton
                  label="View report"
                  icon={<IconFileText className="size-3.5" />}
                  onClick={onViewReport}
                  variant="default"
                />
              ) : null}
            </div>
          }
        />
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
