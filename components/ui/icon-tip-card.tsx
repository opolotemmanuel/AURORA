// Shared icon-in-circle + heading + description card, extracted from
// components/scan/ScanCaptureTips.tsx's per-tip markup so every page that
// wants this visual pattern (small rounded-full icon badge, bold micro
// heading, muted description, in a bordered card) reuses one component
// instead of re-authoring the same classNames per page.
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
    <div className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary",
            iconClassName
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
