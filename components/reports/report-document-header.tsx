import Image from "next/image"

import brandIcon from "@/app/icon.png"
import { cn } from "@/lib/utils"

export type ReportDocumentHeaderProps = {
  scanDate: string
  userName?: string
  captureMode?: string
  creditsCharged?: number | null
  usage?: {
    modelId: string
    totalTokens: number
    inputTokens: number
    outputTokens: number
  } | null
  className?: string
}

export function ReportDocumentHeader({
  scanDate,
  userName,
  captureMode,
  creditsCharged,
  usage,
  className,
}: ReportDocumentHeaderProps) {
  const metaItems: string[] = []

  if (scanDate) metaItems.push(scanDate)
  if (userName) metaItems.push(`Prepared for ${userName}`)
  if (captureMode) metaItems.push(captureMode)

  const tokenItems: string[] = []
  if (creditsCharged != null) {
    tokenItems.push(`${creditsCharged.toLocaleString()} credits`)
  }
  if (usage) {
    tokenItems.push(`${usage.totalTokens.toLocaleString()} tokens`)
    tokenItems.push(usage.modelId)
  }

  return (
    <header className={cn("font-sans border-b border-border pb-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={brandIcon}
            alt=""
            width={32}
            height={32}
            className="size-9 shrink-0 rounded-md"
            style={{ width: "auto", height: "auto" }}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Aurora Organics
            </p>
            <p className="text-xs text-muted-foreground">
              Skin Intelligence Report
            </p>
          </div>
        </div>

        {metaItems.length > 0 ? (
          <div className="text-right text-xs text-muted-foreground">
            {metaItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : null}
      </div>

      {tokenItems.length > 0 ? (
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">
          {tokenItems.join(" · ")}
        </p>
      ) : null}
    </header>
  )
}
