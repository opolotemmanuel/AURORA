"use client"

import type { ReactNode } from "react"

import { CompactNumber } from "@/components/ui/compact-number"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  tooltip,
  className,
}: {
  label: string
  value: string | number
  hint?: ReactNode
  tooltip?: string
  className?: string
}) {
  const valueNode =
    typeof value === "number" ? (
      <CompactNumber value={value} />
    ) : tooltip && tooltip !== value ? (
      <TooltipValue display={value} tooltip={tooltip} />
    ) : (
      value
    )

  return (
    <div className={cn("rounded-none border border-border bg-card p-5", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-medium tabular-nums">
        {valueNode}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function TooltipValue({
  display,
  tooltip,
}: {
  display: string
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default" tabIndex={0}>
          {display}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
