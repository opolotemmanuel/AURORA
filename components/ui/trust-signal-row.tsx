// Shared small-icon + label trust-signal footer row, extracted from
// components/scan/ScanFlow.tsx's dropzone footer (JPG/PNG/WEBP limits,
// lighting tip, "analyzed in memory" privacy line) so any other page
// stating similar quick assurances reuses the same wrapped, centered strip
// instead of a bespoke <ul> per page.
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
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground",
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
