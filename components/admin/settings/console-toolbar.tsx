import Link from "next/link"

// Shared header + action bar for the four admin console tables (Products,
// Users, Scans, Audit Logs). Presentation only: Refresh and Export CSV are
// plain callbacks the caller wires to whatever it already has in memory or
// however it already re-fetches — this component never fetches or exports
// anything itself.
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconDownload, IconRefresh } from "@tabler/icons-react"

type IconComponent = React.ComponentType<{ className?: string }>

export type Breadcrumb = { label: string; href?: string }

export function ConsoleToolbar({
  icon: Icon,
  eyebrow,
  breadcrumb,
  title,
  description,
  primaryAction,
  onRefresh,
  onExport,
  exportDisabled,
  exportLabel = "Export CSV",
  children,
}: {
  icon: IconComponent
  eyebrow: string
  breadcrumb: Breadcrumb[]
  title: string
  description?: string
  primaryAction?: { label: string; icon?: IconComponent; onClick: () => void }
  onRefresh?: () => void
  onExport?: () => void
  exportDisabled?: boolean
  exportLabel?: string
  children?: React.ReactNode
}) {
  const PrimaryIcon = primaryAction?.icon

  return (
    <Card>
      <CardHeader>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <Icon className="size-4" />
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription className="mt-2 max-w-3xl leading-6">{description}</CardDescription> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {primaryAction ? (
              <Button type="button" onClick={primaryAction.onClick}>
                {PrimaryIcon ? <PrimaryIcon className="size-4" /> : null}
                {primaryAction.label}
              </Button>
            ) : null}
            {onRefresh ? (
              <Button type="button" variant="outline" onClick={onRefresh}>
                <IconRefresh className="size-4" />
                Refresh
              </Button>
            ) : null}
            {onExport ? (
              <Button type="button" variant="outline" onClick={onExport} disabled={exportDisabled}>
                <IconDownload className="size-4" />
                {exportLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  )
}
