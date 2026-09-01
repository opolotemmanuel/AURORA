import { NextResponse } from "next/server"

import { authorizeCronRequest } from "@/lib/cron/authorize"
import { drainProductJobs } from "@/lib/products/jobs/worker"

/**
 * Drains the product-intelligence queue on a schedule.
 *
 * This is what makes the queue durable rather than merely persisted. An
 * administrator queues work and closes the tab; this picks it up regardless,
 * because the work is a row in Postgres and this route can reach it.
 *
 * The limit is deliberate. A scheduled invocation has a wall-clock budget, and
 * the drain paces itself to stay inside the provider's per-minute allowance —
 * five jobs at roughly thirteen seconds each is about a minute of work, which
 * fits comfortably and leaves the rest of the queue for the next tick. A queue
 * that cannot be emptied in one pass is not a problem; it is the design.
 */
export async function GET(request: Request) {
  const authorized = authorizeCronRequest(request)
  if (!authorized.ok) return authorized.response

  const outcome = await drainProductJobs({ limit: 5 })

  return NextResponse.json({ ok: true, ...outcome })
}
