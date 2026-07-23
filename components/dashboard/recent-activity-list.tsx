import { IconMinus, IconPlus } from "@tabler/icons-react"

import type { ScanLedgerEntry } from "@/lib/scans/balance"
import { cn } from "@/lib/utils"

// Real ScanLedger rows for the signed-in user — the credit-specific audit
// trail described in prisma/schema.prisma's ScanLedger doc comment, same
// spirit as the admin Audit Logs tab but scoped to one user's own credits.
const REASON_LABELS: Record<ScanLedgerEntry["reason"], string> = {
  signup_bonus: "Welcome bonus",
  scan_debit: "Scan",
  admin_grant: "Admin grant",
}

export function RecentActivityList({ entries }: { entries: ScanLedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        No credit activity yet — this fills in once you take your first scan.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                entry.delta < 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
              )}
            >
              {entry.delta < 0 ? <IconMinus className="size-3.5" /> : <IconPlus className="size-3.5" />}
            </span>
            <span className="text-sm text-foreground">{REASON_LABELS[entry.reason]}</span>
          </div>
          <div className="flex items-center gap-3 text-right">
            <span className={cn("text-sm font-medium tabular-nums", entry.delta < 0 ? "text-foreground" : "text-primary")}>
              {entry.delta > 0 ? "+" : ""}
              {entry.delta}
            </span>
            <span className="w-20 shrink-0 text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short" })
}
