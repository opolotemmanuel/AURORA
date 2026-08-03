// Shared small-icon + label trust-signal footer row, extracted from
// components/scan/ScanFlow.tsx's dropzone footer. Wrapper spacing/type size
// pulled verbatim from wyasyn/review's components/scan/scan-upload-panel.tsx
// QUALITY_NOTES list.
import { cn } from "@/lib/utils"

export type TrustSignalItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export function TrustSignalRow({
  items,
  className,
}: {
  items: TrustSignalItem[]
  className?: string
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1 pb-0.5 text-[11px] text-muted-foreground",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.label} className="flex items-center gap-1.5">
            <Icon className="size-3.5 shrink-0 text-primary/70" />
            {item.label}
          </li>
        )
      })}
    </ul>
  )
}
