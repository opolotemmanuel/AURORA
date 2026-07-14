// New route — self-service only, no role check beyond "is signed in"
// (already enforced by the parent (dashboard)/layout.tsx). Scoped exactly
// like /profile and /reports: listReportsForUser filters by
// session.user.id server-side, so a user can never see another user's
// trend data by construction, not just because the UI hides it.
//
// Pure aggregation of existing ReportFinding rows (see
// lib/reports/skin-history.ts) — no new AI calls, no schema changes.
import { redirect } from "next/navigation"
import { IconChartLine } from "@tabler/icons-react"

import { SkinHistorySection } from "@/components/profile/skin-history/skin-history-section"
import { getSession } from "@/lib/auth/session"
import { listReportsForUser } from "@/lib/backend/report-store"
import { buildSkinHistory } from "@/lib/reports/skin-history"

export const dynamic = "force-dynamic"

// Pragmatic cap on how much history one page load pulls back — generous
// enough that no real user hits it in practice, without querying an
// unbounded number of reports.
const HISTORY_LIMIT = 60

export default async function SkinHistoryPage() {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const reports = await listReportsForUser(session.user.id, HISTORY_LIMIT)
  const trends = buildSkinHistory(reports)

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconChartLine className="size-4" />
          Skin History
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Your trends over time</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          How your cosmetic readings have moved across your past scans — visible only to you.
        </p>
      </section>

      <SkinHistorySection trends={trends} />
    </div>
  )
}
