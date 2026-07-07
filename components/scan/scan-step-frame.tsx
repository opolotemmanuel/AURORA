import type { ReactNode } from "react"

import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { ScanFlowHeader } from "@/components/scan/scan-flow-header"
import { cn } from "@/lib/utils"

type ScanStepFrameProps = {
  children: ReactNode
  headerTrailing?: ReactNode
  headerClassName?: string
  className?: string
}

export function ScanStepFrame({
  children,
  headerTrailing,
  headerClassName,
  className,
}: ScanStepFrameProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center overflow-visible",
        className,
      )}
    >
      <ScanFlowHeader
        className={headerClassName}
        trailing={headerTrailing ?? <ScanDashboardLink variant="action" />}
      />
      {children}
    </div>
  )
}
