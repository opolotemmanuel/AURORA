"use client"

import { ScanFeedbackWidget, type ScanFeedbackRecord } from "@/components/scan/scan-feedback-widget"
import { ScanFollowUpChat } from "@/components/scan/scan-follow-up-chat"
import { cn } from "@/lib/utils"

type ScanReportChatDockProps = {
  scanId: string
  existingFeedback?: ScanFeedbackRecord | null
  className?: string
}

export function ScanReportChatDock({
  scanId,
  existingFeedback = null,
  className,
}: ScanReportChatDockProps) {
  return (
    <div
      className={cn(
        "relative inline-flex w-full max-w-[min(92vw,380px)] flex-col items-end",
        className,
      )}
    >
      <ScanFeedbackWidget
        scanId={scanId}
        existingFeedback={existingFeedback}
        anchored
        className="pointer-events-auto absolute right-0 bottom-full z-40 mb-1.5"
      />
      <ScanFollowUpChat scanId={scanId} className="relative w-full" />
    </div>
  )
}
