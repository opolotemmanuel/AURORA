import { ReportApplicationSchedule } from "@/components/reports/report-application-schedule"
import type { NaturalRecommendation } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type ChatNaturalRecommendationsProps = {
  items: NaturalRecommendation[]
  className?: string
}

export function ChatNaturalRecommendations({
  items,
  className,
}: ChatNaturalRecommendationsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn("min-w-0 space-y-2 border-t border-border/60 pt-3", className)}>
      <p className="text-xs font-medium text-foreground">Everyday care</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2 text-sm">
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.title}</p>
              <ReportApplicationSchedule
                applicationTime={item.applicationTime}
                applicationFrequency={item.applicationFrequency}
                className="mt-0.5"
              />
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
