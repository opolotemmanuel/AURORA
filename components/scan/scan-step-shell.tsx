"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ScanStepShellProps = {
  title: string
  description?: string
  headerActions?: ReactNode
  children: ReactNode
  className?: string
}

export function ScanStepShell({
  title,
  description,
  headerActions,
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
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0 space-y-2">
          <p className="font-heading text-sm font-semibold text-foreground">
            {title}
          </p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="shrink-0 pt-0.5">{headerActions}</div>
        ) : null}
      </div>
      {children}
    </div>
  )
}
