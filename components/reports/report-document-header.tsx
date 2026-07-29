import Image from "next/image"

import brandIcon from "@/app/icon.png"
import { formatTokenBreakdownWithTotal } from "@/lib/tokens/format-usage"
import { cn } from "@/lib/utils"

export type ReportDocumentHeaderProps = {
  scanDate: string
  userName?: string
  captureMode?: string
  usage?: {
    modelId: string
    totalTokens: number
    inputTokens: number
    outputTokens: number
    cachedTokens?: number
    reasoningTokens?: number | null
  } | null
  className?: string
}

export function ReportDocumentHeader({
  scanDate,
  userName,
  captureMode,
  usage,
  className,
}: ReportDocumentHeaderProps) {
  const metaItems: string[] = []

  if (scanDate) metaItems.push(scanDate)
  if (userName) metaItems.push(`Prepared for ${userName}`)
  if (captureMode) metaItems.push(captureMode)

  const usageItems: string[] = []
  if (usage) {
    usageItems.push(
      formatTokenBreakdownWithTotal({
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cachedTokens: usage.cachedTokens,
        reasoningTokens: usage.reasoningTokens ?? undefined,
        totalTokens: usage.totalTokens,
      }),
    )
  }

  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Image
          src={brandIcon}
          alt="Aurora Organics"
          width={40}
          height={40}
          className="size-10 rounded-lg"
        />
        <div>
          <p className="font-heading text-lg font-medium">Skin intelligence report</p>
          {metaItems.length > 0 ? (
            <p className="text-sm text-muted-foreground">{metaItems.join(" · ")}</p>
          ) : null}
        </div>
      </div>
      {usageItems.length > 0 ? (
        <p className="text-xs text-muted-foreground">{usageItems.join(" · ")}</p>
      ) : null}
    </header>
  )
}
