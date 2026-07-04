"use client"

import type { ReactNode } from "react"

import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { cn } from "@/lib/utils"

type ScanStepShellProps = {
  title: string
  description?: string
  headerTrailing?: ReactNode
  children: ReactNode
  className?: string
}

export function ScanStepShell({
  title,
  description,
  headerTrailing,
  children,
  className,
}: ScanStepShellProps) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl space-y-4 rounded-[2rem] border border-border bg-background p-3",
        className,
      )}
    >
      <div className="space-y-2 px-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="font-heading text-sm font-semibold text-foreground">
            {title}
          </p>
          <div className="flex shrink-0 items-center self-start sm:self-center">
            {headerTrailing ?? <ScanDashboardLink variant="segment" />}
          </div>
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}
