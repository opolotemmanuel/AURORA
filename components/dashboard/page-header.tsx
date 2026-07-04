import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function DashboardPageHeader({
  title,
  description,
  badge,
}: {
  title: string
  description?: string
  badge?: string
}) {
  return (
    <div className="space-y-2 border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-medium tracking-tight">{title}</h1>
        {badge ? (
          <Badge variant="secondary" className="font-normal">
            {badge}
          </Badge>
        ) : null}
      </div>
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string | number
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-medium tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
