"use client"

import type { ReactNode } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Ported verbatim from wyasyn/review's components/scan/capture-tab-tooltip.tsx.
type CaptureTabTooltipProps = {
  label: string
  children: ReactNode
}

export function CaptureTabTooltip({ label, children }: CaptureTabTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
