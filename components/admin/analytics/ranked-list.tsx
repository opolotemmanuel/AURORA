// One reusable ranked-row list, shared by every "Most common findings" /
// "Top recommended products" / "Feature adoption" / "Role breakdown" panel
// on the analytics page — same label-left, big-number-right shape each
// time, just different source data per caller.
export type RankedRow = {
  key: string
  label: string
  value: string
  detail?: string
}

export function RankedList({ rows, emptyLabel }: { rows: RankedRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 rounded-lg bg-muted p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.label}</p>
            {row.detail ? <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p> : null}
          </div>
          <span className="shrink-0 text-xl font-semibold">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
