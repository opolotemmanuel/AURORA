"use client"

import { Fragment, useMemo, useState } from "react"
import { IconAlertTriangle, IconCircleCheck, IconClock } from "@tabler/icons-react"

import type { ProductQualityRow } from "@/lib/products/catalogue-health"
import { CONFIDENT_RECOMMENDATION_THRESHOLD } from "@/lib/products/completeness"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The catalogue as an administrator needs to read it.
 *
 * Source data and derived intelligence are shown as separate groups of columns,
 * because the difference is the whole point of the ingestion architecture: the
 * store says what a product is, and the extraction pass says how the engine can
 * understand it. A table that mixed them would make a merchant's fact and an
 * inference look identical.
 */

export type QualityFilter =
  | "all"
  | "complete"
  | "incomplete"
  | "verified"
  | "unverified"
  | "recommendable"
  | "not_recommendable"
  | "active"
  | "archived"
  | "needs_extraction"

const FILTERS: ReadonlyArray<{ value: QualityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "needs_extraction", label: "Needs extraction" },
  { value: "incomplete", label: "Incomplete" },
  { value: "complete", label: "Complete" },
  { value: "unverified", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "recommendable", label: "Recommendable" },
  { value: "not_recommendable", label: "Not recommendable" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
]

export function matchesFilter(row: ProductQualityRow, filter: QualityFilter): boolean {
  switch (filter) {
    case "complete":
      return row.missing.length === 0
    case "incomplete":
      return row.missing.length > 0
    case "verified":
      return row.verificationStatus === "confirmed"
    case "unverified":
      return row.verificationStatus !== "confirmed"
    case "recommendable":
      return row.isActive && row.isRecommendable
    case "not_recommendable":
      return !row.isActive || !row.isRecommendable
    case "active":
      return row.isActive
    case "archived":
      return !row.isActive
    case "needs_extraction":
      return row.intelligenceStale || row.primaryClassification === null
    default:
      return true
  }
}

function QualityBar({ score }: { score: number }) {
  const confident = score >= CONFIDENT_RECOMMENDATION_THRESHOLD
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", confident ? "bg-primary" : "bg-amber-500")}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{score}%</span>
    </div>
  )
}

function Cell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-xs text-muted-foreground/50">—</span>
  }
  return (
    <span className="text-xs text-foreground">
      {values.length > 2
        ? `${values.slice(0, 2).join(", ")} +${values.length - 2}`
        : values.join(", ")}
    </span>
  )
}

function VerificationBadge({ row }: { row: ProductQualityRow }) {
  if (row.intelligenceStale) {
    return (
      <Badge variant="outline" className="gap-1 text-[0.65rem]">
        <IconClock className="size-3" aria-hidden /> Stale
      </Badge>
    )
  }
  if (row.verificationStatus === "confirmed") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/40 text-[0.65rem] text-primary">
        <IconCircleCheck className="size-3" aria-hidden /> Verified
      </Badge>
    )
  }
  if (row.primaryClassification === null) {
    return (
      <Badge variant="outline" className="gap-1 text-[0.65rem]">
        <IconAlertTriangle className="size-3" aria-hidden /> Not extracted
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[0.65rem]">
      Imported
    </Badge>
  )
}

type ProductQualityTableProps = {
  rows: ProductQualityRow[]
  onOpen: (id: string) => void
}

export function ProductQualityTable({ rows, onOpen }: ProductQualityTableProps) {
  const [filter, setFilter] = useState<QualityFilter>("all")
  const [expanded, setExpanded] = useState<string | null>(null)

  const counts = useMemo(() => {
    const result = {} as Record<QualityFilter, number>
    for (const { value } of FILTERS) {
      result[value] = rows.filter((row) => matchesFilter(row, value)).length
    }
    return result
  }, [rows])

  const visible = useMemo(
    () => rows.filter((row) => matchesFilter(row, filter)),
    [rows, filter],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "rounded-sm border px-2 py-1 text-xs font-medium transition-colors",
              filter === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span className="ml-1 tabular-nums opacity-60">{counts[value]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full min-w-[70rem] text-xs">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Classification</th>
              <th className="px-3 py-2 font-medium">Skin types</th>
              <th className="px-3 py-2 font-medium">Concerns</th>
              <th className="px-3 py-2 font-medium">Ingredients</th>
              <th className="px-3 py-2 font-medium">Climate</th>
              <th className="px-3 py-2 font-medium">Routine</th>
              <th className="px-3 py-2 font-medium">Data quality</th>
              <th className="px-3 py-2 font-medium">Verification</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((row) => (
              // Keyed on the fragment, not the rows: a product renders as one
              // row plus an optional detail row, and keying the children would
              // make React treat the pair as two independent siblings.
              <Fragment key={row.id}>
                <tr
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  className="cursor-pointer hover:bg-muted/20"
                >
                  <td className="px-3 py-2">
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span className="block text-[0.65rem] text-muted-foreground">
                      {row.slug}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-foreground">{row.source}</span>
                    <span className="block text-[0.65rem] text-muted-foreground">
                      {row.externalId ? `#${row.externalId}` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {row.primaryClassification ? (
                      <span className="text-foreground">{row.primaryClassification}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2"><Cell values={row.suitableSkinTypes} /></td>
                  <td className="px-3 py-2"><Cell values={row.targetConcerns} /></td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.ingredientLinkCount > 0 ? (
                      <span className="text-foreground">{row.ingredientLinkCount} linked</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2"><Cell values={row.climateTags} /></td>
                  <td className="px-3 py-2">
                    {row.routineCategory ? (
                      <span className="text-foreground">{row.routineCategory}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2"><QualityBar score={row.completenessScore} /></td>
                  <td className="px-3 py-2"><VerificationBadge row={row} /></td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "text-[0.65rem] font-medium",
                        row.isActive && row.isRecommendable
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {!row.isActive
                        ? "Archived"
                        : row.isRecommendable
                          ? "Recommendable"
                          : "Listed only"}
                    </span>
                    <span className="block text-[0.65rem] text-muted-foreground">
                      {row.availability.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
                {expanded === row.id ? (
                  <tr className="bg-muted/10">
                    <td colSpan={11} className="px-3 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
                            Data quality {row.completenessScore}%
                          </p>
                          {row.missing.length === 0 ? (
                            <p className="text-xs text-foreground">
                              Every field the pipeline reads is populated.
                            </p>
                          ) : (
                            <ul className="text-xs text-muted-foreground">
                              {row.missing.map((field) => (
                                <li key={field}>· {field}</li>
                              ))}
                            </ul>
                          )}
                          {row.intelligenceStale ? (
                            <p className="text-xs text-amber-600">
                              Source text changed since this was extracted.
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpen(row.id)
                          }}
                        >
                          Edit intelligence
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">No products match this filter.</p>
      ) : null}
    </div>
  )
}
