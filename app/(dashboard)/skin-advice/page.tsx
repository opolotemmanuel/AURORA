// General skin-advice AI chat — replaces the earlier RecommendedProducts
// repurposing (that content still lives at /dashboard and inside each
// report). See components/skin-advice/skin-advice-chat.tsx, shared with the
// scan flow's "Advice" tab (components/scan/ScanFlow.tsx).
import Link from "next/link"
import { redirect } from "next/navigation"
import { IconArrowUpRight, IconSparkles } from "@tabler/icons-react"

import { SkinAdviceChat } from "@/components/skin-advice/skin-advice-chat"
import { getSession } from "@/lib/auth/session"
import { listReportsForUser } from "@/lib/backend/report-store"

export const dynamic = "force-dynamic"

export default async function SkinAdvicePage() {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const [latest] = await listReportsForUser(session.user.id, 1)

  return (
    <div className="max-w-3xl space-y-6">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconSparkles className="size-4" />
          Skin advice
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Ask Aura</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          General skincare guidance — cosmetic and wellness only, not a medical
          diagnosis.
        </p>
      </section>

      {latest ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Grounded in your scan from {formatDate(latest.createdAt)}.
          </p>
          <Link
            href={`/reports/${latest.id}`}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View full report
            <IconArrowUpRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          No scan yet — Aura can still answer general skincare questions.{" "}
          <Link
            href="/scan"
            className="font-medium text-primary hover:underline"
          >
            Start a scan
          </Link>{" "}
          for advice grounded in your own results.
        </div>
      )}

      <SkinAdviceChat />
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
