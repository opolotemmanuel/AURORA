"use client"

// Shared "Showing X of Y" footer for the four admin console tables. Pass an
// href-based prev/next for server-paginated data (Scans, unchanged
// skip/take mechanism) or an onClick-based prev/next for client-paginated
// data (Products, Users, Audit Logs — the full/filtered array is already in
// the browser). `total` must be a real count already available to the
// caller; this component never invents one.
import Link from "next/link"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type NavAction = { href: string } | { onClick: () => void }

export function PaginationFooter({
  start,
  end,
  total,
  itemLabel = "items",
  page,
  pageCount,
  prev,
  next,
  extra,
}: {
  start: number
  end: number
  total: number
  itemLabel?: string
  page: number
  pageCount: number
  prev: NavAction | null
  next: NavAction | null
  extra?: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Showing <span className="font-medium text-foreground">{total === 0 ? 0 : start}-{end}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> {itemLabel}
          </span>
          {extra}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NavButton action={prev}>
            <IconChevronLeft className="size-4" />
            Previous
          </NavButton>
          <span className="rounded-md border border-border bg-muted px-3 py-2 text-xs">
            Page {page} of {Math.max(pageCount, 1)}
          </span>
          <NavButton action={next}>
            Next
            <IconChevronRight className="size-4" />
          </NavButton>
        </div>
      </CardContent>
    </Card>
  )
}

function NavButton({ action, children }: { action: NavAction | null; children: React.ReactNode }) {
  const className = "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium"

  if (!action) {
    return <span className={cn(className, "border-border bg-muted text-muted-foreground")}>{children}</span>
  }

  if ("href" in action) {
    return (
      <Link href={action.href} className={cn(className, "border-border bg-background hover:bg-accent hover:text-accent-foreground")}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={cn(className, "border-border bg-background hover:bg-accent hover:text-accent-foreground")}>
      {children}
    </button>
  )
}
