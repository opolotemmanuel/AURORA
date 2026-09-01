"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { IconPlayerPlay, IconX } from "@tabler/icons-react"

import {
  bulkExtractOneAction,
  type BulkExtractOutcome,
} from "@/lib/products/intelligence/bulk-actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Runs extraction across a selection, one product at a time.
 *
 * Sequential by construction rather than by a rate limiter alone: the next
 * product is only requested once the previous one has come back, so a bulk run
 * can never open more provider requests than there are administrators clicking.
 * The pause between them keeps a long run inside the per-minute allowance.
 *
 * Stopping on quota exhaustion is the point of the whole component. The
 * remaining products are left in whatever state they were already in and
 * reported as not processed — never as failed, which would blame each row for
 * an account-level limit.
 */

/** Just inside the provider's five-per-minute allowance. */
const PACE_MS = 13_000

type RunState = {
  total: number
  done: number
  running: string | null
  outcomes: Map<string, BulkExtractOutcome>
  stoppedByQuota: boolean
  cancelled: boolean
}

function outcomeLabel(outcome: BulkExtractOutcome): { text: string; tone: string } {
  switch (outcome.kind) {
    case "extracted":
      return { text: `Extracted ${outcome.completenessScore}%`, tone: "text-primary" }
    case "needs_review":
      return {
        text: `Needs review ${outcome.completenessScore}%`,
        tone: "text-amber-600",
      }
    case "skipped":
      return { text: `Skipped — ${outcome.reason}`, tone: "text-muted-foreground" }
    case "failed":
      return { text: "Failed", tone: "text-destructive" }
    case "quota_exhausted":
      return { text: "Not processed — quota", tone: "text-muted-foreground" }
  }
}

type ProductBulkExtractProps = {
  selected: Array<{ id: string; name: string }>
  onClear: () => void
}

export function ProductBulkExtract({ selected, onClear }: ProductBulkExtractProps) {
  const router = useRouter()
  const [state, setState] = useState<RunState | null>(null)
  // A ref rather than state: the running loop reads it between products, and a
  // state value captured at the start of the run would never see the change.
  const cancelRef = useRef(false)

  async function run() {
    cancelRef.current = false
    const outcomes = new Map<string, BulkExtractOutcome>()

    setState({
      total: selected.length,
      done: 0,
      running: null,
      outcomes,
      stoppedByQuota: false,
      cancelled: false,
    })

    for (const [index, product] of selected.entries()) {
      if (cancelRef.current) {
        setState((current) => (current ? { ...current, cancelled: true, running: null } : current))
        break
      }

      setState((current) => (current ? { ...current, running: product.id } : current))

      // Explicitly forced. The administrator picked these products, which is a
      // different intent from the automatic pass that only takes what is due.
      const result = await bulkExtractOneAction(product.id, { force: true })
      outcomes.set(product.id, result.outcome)

      if (result.outcome.kind === "quota_exhausted") {
        setState((current) =>
          current
            ? {
                ...current,
                running: null,
                stoppedByQuota: true,
                outcomes: new Map(outcomes),
              }
            : current,
        )
        router.refresh()
        return
      }

      setState((current) =>
        current
          ? { ...current, done: index + 1, running: null, outcomes: new Map(outcomes) }
          : current,
      )

      if (index < selected.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, PACE_MS))
      }
    }

    router.refresh()
  }

  const busy = state !== null && state.running !== null

  return (
    <div className="space-y-3 rounded-sm border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {selected.length} product{selected.length === 1 ? "" : "s"} selected
          </p>
          <p className="text-xs text-muted-foreground">
            Extraction runs one product at a time, about {PACE_MS / 1000}s apart, to
            stay inside the provider allowance. Closing this page stops the run —
            products already finished keep their result.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={run} disabled={busy || selected.length === 0}>
            <IconPlayerPlay className="size-3.5" aria-hidden />
            {busy ? "Extracting…" : "Extract intelligence"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              cancelRef.current = true
              onClear()
              setState(null)
            }}
          >
            <IconX className="size-3.5" aria-hidden />
            {busy ? "Stop" : "Clear"}
          </Button>
        </div>
      </div>

      {state ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            {state.done} of {state.total} processed
          </p>

          {state.stoppedByQuota ? (
            <p className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              Provider quota reached. Remaining products were not processed and keep
              their previous state — you can run this again later.
            </p>
          ) : null}

          {state.cancelled ? (
            <p className="text-xs text-muted-foreground">
              Stopped. Products already processed keep their result.
            </p>
          ) : null}

          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {selected.map((product) => {
              const outcome = state.outcomes.get(product.id)
              const isRunning = state.running === product.id
              const label = outcome ? outcomeLabel(outcome) : null

              return (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="truncate text-foreground">{product.name}</span>
                  <span
                    className={cn(
                      "shrink-0",
                      isRunning ? "text-foreground" : (label?.tone ?? "text-muted-foreground/60"),
                    )}
                  >
                    {isRunning ? "Extracting…" : (label?.text ?? "Pending")}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
