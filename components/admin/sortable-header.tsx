"use client"

// Shared sortable <th> for the four admin console tables. `onSort` drives
// client-side Array.prototype.sort of already-loaded data (Products, Users,
// Audit Logs); `href` drives the existing server-side sort query param
// (Scans) so it never fakes a client sort over a partial, single-page
// dataset. `direction` is optional: some existing sort fields (e.g. Scans'
// Status/AI Source columns) only ever sort one direction today, so the
// header shows an "active" state without implying a toggle that doesn't
// exist.
import Link from "next/link"
import { IconArrowsSort, IconSortAscending, IconSortDescending } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { TableHead } from "@/components/ui/table"

export function SortableHeader({
  label,
  active,
  direction,
  onSort,
  href,
  className,
}: {
  label: string
  active: boolean
  direction?: "asc" | "desc"
  onSort?: () => void
  href?: string
  className?: string
}) {
  const Icon = !active ? IconArrowsSort : direction === "asc" ? IconSortAscending : direction === "desc" ? IconSortDescending : IconArrowsSort

  const content = (
    <span className={cn("inline-flex items-center gap-1", active ? "text-foreground" : "text-muted-foreground")}>
      {label}
      <Icon className="size-3.5" />
    </span>
  )

  return (
    <TableHead className={className}>
      {href ? (
        <Link href={href} className="inline-flex items-center hover:text-foreground">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onSort} className="inline-flex items-center hover:text-foreground">
          {content}
        </button>
      )}
    </TableHead>
  )
}
