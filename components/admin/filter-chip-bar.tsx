"use client"

// Shared removable-filter-chip UI for the four admin console tables.
// Two lower-level primitives (FilterChip, AddFilterMenu) plus
// SingleSelectFilterChips, the composed pattern all four tabs use: one
// active facet shown as a removable chip, the rest offered behind a small
// "+ Add filter" popover instead of a bare <select>. Each option can be
// wired to either a client callback (already-loaded array in state) or an
// href (existing server-side query-param navigation) — never both — so the
// same component works for client-filtered tabs and the server-filtered
// Scans tab without either one faking the other's mechanism.
import Link from "next/link"
import { IconChevronDown, IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

type ChipTarget = { href: string; onSelect?: undefined } | { href?: undefined; onSelect: () => void }

export type FilterChipOption = { value: string; label: string } & ChipTarget

const CHIP_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-medium text-primary hover:bg-primary/15"

export function FilterChip({ label, target }: { label: string; target: ChipTarget }) {
  const content = (
    <>
      {label}
      <IconX className="size-3.5" />
    </>
  )

  if (target.href) {
    return (
      <Link href={target.href} className={CHIP_CLASS} aria-label={`Remove ${label} filter`}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={target.onSelect} className={CHIP_CLASS} aria-label={`Remove ${label} filter`}>
      {content}
    </button>
  )
}

export function AddFilterMenu({ label = "Add filter", options }: { label?: string; options: FilterChipOption[] }) {
  if (options.length === 0) return null

  return (
    <details className="relative">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground hover:border-solid hover:bg-muted hover:text-foreground">
        + {label}
        <IconChevronDown className="size-3.5" />
      </summary>
      <div className="absolute left-0 z-20 mt-2 min-w-48 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg">
        {options.map((option) =>
          option.href ? (
            <Link
              key={option.value}
              href={option.href}
              className="block rounded-md px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground"
            >
              {option.label}
            </Link>
          ) : (
            <button
              key={option.value}
              type="button"
              onClick={option.onSelect}
              className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"
            >
              {option.label}
            </button>
          ),
        )}
      </div>
    </details>
  )
}

// The common shape all four tabs need: a single active facet value ("all"
// means no filter applied), shown as one removable chip, with the rest of
// the facet's options offered via AddFilterMenu. Pass `onChange` for
// client-side state or `getHref` for server-side query-param navigation.
export function SingleSelectFilterChips({
  value,
  options,
  onChange,
  getHref,
  addLabel,
  className,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange?: (value: string) => void
  getHref?: (value: string) => string
  addLabel?: string
  className?: string
}) {
  const active = options.find((option) => option.value === value)
  const rest = options.filter((option) => option.value !== value)

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {active ? (
        <FilterChip
          label={active.label}
          target={getHref ? { href: getHref("all") } : { onSelect: () => onChange?.("all") }}
        />
      ) : null}
      <AddFilterMenu
        label={addLabel}
        options={rest.map((option) =>
          getHref
            ? { value: option.value, label: option.label, href: getHref(option.value) }
            : { value: option.value, label: option.label, onSelect: () => onChange?.(option.value) },
        )}
      />
    </div>
  )
}
