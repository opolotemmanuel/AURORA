// New route per this pass's sidebar spec. Repurposes the existing
// recommendation content (RecommendedProducts, already used inside a single
// report's view) as a standalone page showing the signed-in user's latest
// recommendations, rather than inventing new "skin advice" content.
import Link from "next/link"
import { IconArrowUpRight, IconSparkles } from "@tabler/icons-react"

import { RecommendedProducts } from "@/components/report/sections/recommended-products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth/session"
import { listReportsForUser } from "@/lib/backend/report-store"
import { loadReportViewModel } from "@/lib/reports/load-report-view-model"

export const dynamic = "force-dynamic"

export default async function SkinAdvicePage() {
  // Non-null: (dashboard)/layout.tsx already redirects to /login otherwise.
  const session = (await getSession())!
  const [latest] = await listReportsForUser(session.user.id, 1)

  const vm = latest ? await loadReportViewModel(latest.id) : null

  return (
    <div className="max-w-4xl space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconSparkles className="size-4" />
          Skin advice
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Your product matches</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Aurora product recommendations from your most recent scan — cosmetic and wellness guidance only, not a
          medical diagnosis.
        </p>
      </section>

      {vm ? (
        <>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              From your scan on {vm.executiveSummary.scanDateLabel}.
            </p>
            <Link
              href={`/reports/${vm.reportId}`}
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View full report
              <IconArrowUpRight className="size-4" />
            </Link>
          </div>
          <RecommendedProducts vm={vm} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No scans yet</CardTitle>
            <CardDescription>Complete a scan to get personalized product recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/scan">Start a scan</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
