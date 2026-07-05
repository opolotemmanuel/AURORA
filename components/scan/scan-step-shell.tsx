"use client"

import type { ReactNode } from "react"

import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { cn } from "@/lib/utils"

type ScanStepShellProps = {
  title: string
  description?: string
  headerTrailing?: ReactNode
  showDashboardLink?: boolean
  children: ReactNode
  className?: string
}

export function ScanStepShell({
  title,
  description,
  headerTrailing,
  showDashboardLink = true,
  children,
  className,
}: ScanStepShellProps) {
  const trailing =
    headerTrailing ??
    (showDashboardLink ? <ScanDashboardLink variant="segment" /> : null)

  return (
    <div
      className={cn(
        "w-full max-w-2xl space-y-4 rounded-[2rem] border border-border bg-background p-3",
        className,
      )}
    >
      <div className="space-y-2 px-1">
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
            trailing ? "sm:justify-between" : "",
          )}
        >
          <p className="font-heading text-sm font-semibold text-foreground">
            {title}
          </p>
          {trailing ? (
            <div className="flex shrink-0 items-center self-start sm:self-center">
              {trailing}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}
