"use client"

import { AnimatedBadge, type AnimatedBadgeSize } from "@/components/motion/animated-badge"
import { formatBand } from "@/lib/scan/format"
import { getBandAnimatedStatus } from "@/lib/scan/band-styles"
import type { AssessmentBand } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type BandBadgeProps = {
  band: AssessmentBand
  size?: AnimatedBadgeSize
  className?: string
}

export function BandBadge({ band, size = "sm", className }: BandBadgeProps) {
  return (
    <AnimatedBadge
      status={getBandAnimatedStatus(band)}
      size={size}
      className={cn("shrink-0", className)}
      contentKey={band}
    >
      {formatBand(band)}
    </AnimatedBadge>
  )
}
