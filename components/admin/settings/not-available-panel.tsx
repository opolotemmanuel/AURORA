// Shared "not yet available" state for every Enterprise Settings tab that
// isn't real yet — never a blank tab, never a fake/disabled control. Honest
// about what's missing and why, per the tabbed console's no-fabrication rule.
import type { ComponentType } from "react"

import { Card, CardContent } from "@/components/ui/card"

export function NotAvailablePanel({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Not yet available</p>
      </CardContent>
    </Card>
  )
}
