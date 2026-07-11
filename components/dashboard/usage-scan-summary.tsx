"use client"

import { CompactNumber } from "@/components/ui/compact-number"

type UsageScanSummaryProps = {
  lifetimeUsed: number
  lifetimeGranted: number
  remaining: number
}

export function UsageScanSummary({
  lifetimeUsed,
  lifetimeGranted,
  remaining,
}: UsageScanSummaryProps) {
  return (
    <>
      <div>
        <h2 className="font-heading text-sm font-medium">Scans used</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <CompactNumber value={lifetimeUsed} /> of{" "}
          <CompactNumber value={lifetimeGranted} /> granted
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        <CompactNumber value={remaining} /> remaining
      </p>
    </>
  )
}
