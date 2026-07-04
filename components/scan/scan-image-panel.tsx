"use client"

import type { ReactNode } from "react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { cn } from "@/lib/utils"

type ScanImagePanelProps = {
  imageSrc?: string | null
  isLoading?: boolean
  loadingLabel?: string
  overlay?: ReactNode
  /** Constrain width for report layout; image keeps natural aspect height */
  compact?: boolean
  className?: string
}

export function ScanImagePanel({
  imageSrc,
  isLoading = false,
  loadingLabel = "Analyzing",
  overlay,
  compact = false,
  className,
}: ScanImagePanelProps) {
  if (!imageSrc) {
    return (
      <div
        className={cn(
          "flex aspect-[3/4] w-full items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-muted/30",
          compact && "max-w-[280px]",
          className,
        )}
      >
        <p className="px-4 text-center text-sm text-muted-foreground">
          Photo not retained for this report
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-border",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="Scan photo"
        className={cn(
          "block w-full object-cover",
          compact ? "h-auto" : "aspect-[3/4]",
        )}
      />

      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px]">
          <AnimatedBadge status="loading" size="md" aria-live="polite">
            {loadingLabel}
          </AnimatedBadge>
          {overlay}
        </div>
      ) : null}
    </div>
  )
}
