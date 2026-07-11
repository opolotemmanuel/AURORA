import { cn } from "@/lib/utils"

type RecommendationSectionHeaderProps = {
  title: string
  description: string
  className?: string
}

export function RecommendationSectionHeader({
  title,
  description,
  className,
}: RecommendationSectionHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
