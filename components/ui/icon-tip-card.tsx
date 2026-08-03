// Shared icon-in-circle + heading + description card, extracted from
// components/scan/ScanCaptureTips.tsx's per-tip markup so every page that
// wants this visual pattern reuses one component instead of re-authoring the
// same classNames per page. Visual treatment (card/icon-badge/type classes)
// pulled verbatim from wyasyn/review's components/scan/scan-camera-hints.tsx
// tip-card markup — including the .scan-surface gradient (see
// app/globals.css) and the icon badge's ring.
import { cn } from "@/lib/utils"

export function IconTipCard({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
  iconClassName?: string
}) {
  return (
    <div
      className={cn(
        "scan-surface rounded-2xl border border-border/70 p-3 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
            iconClassName
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs leading-none font-semibold text-foreground">{title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
