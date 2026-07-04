"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getLedgerDetail,
  getLedgerFullLabel,
  getLedgerShortLabel,
} from "@/lib/dashboard/ledger-label"
import { cn } from "@/lib/utils"

export type RecentActivityEntry = {
  delta: number
  reason: string
  createdAt: string | Date
  metadata: unknown
}

const PREVIEW_COUNT = 5

function formatWhen(createdAt: string | Date): string {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function ActivityRow({ entry }: { entry: RecentActivityEntry }) {
  const detail = getLedgerDetail(entry.reason, entry.metadata)
  const fullLabel = getLedgerFullLabel(entry.reason, entry.metadata)

  return (
    <li
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 border-b border-border py-2 last:border-0"
      title={fullLabel}
    >
      <div className="min-w-0">
        <p className="truncate text-sm capitalize text-foreground">
          {getLedgerShortLabel(entry.reason)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatWhen(entry.createdAt)}
          {detail ? ` · ${detail}` : null}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 pt-0.5 text-sm font-medium tabular-nums",
          entry.delta > 0 ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {entry.delta > 0 ? "+" : ""}
        {entry.delta.toLocaleString()}
      </span>
    </li>
  )
}

export function RecentActivityList({
  entries,
}: {
  entries: RecentActivityEntry[]
}) {
  const [expanded, setExpanded] = useState(false)

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
  }

  const canExpand = entries.length > PREVIEW_COUNT
  const visibleEntries = expanded ? entries : entries.slice(0, PREVIEW_COUNT)

  return (
    <div className="space-y-3">
      <ScrollArea className={cn(expanded && "max-h-[min(320px,45vh)]")}>
        <ul className="pr-3 text-sm">
          {visibleEntries.map((entry, index) => (
            <ActivityRow key={`${entry.reason}-${entry.createdAt}-${index}`} entry={entry} />
          ))}
        </ul>
      </ScrollArea>
      {canExpand ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {expanded
              ? `${entries.length} recent entries`
              : `Showing ${PREVIEW_COUNT} of ${entries.length}`}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : "Show all"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
