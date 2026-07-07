"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ScanStepShellProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function ScanStepShell({
  title,
  description,
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
        <p className="font-heading text-sm font-semibold text-foreground">
          {title}
        </p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}
