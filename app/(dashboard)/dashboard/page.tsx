import Link from "next/link"
import { IconCamera } from "@tabler/icons-react"

import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { DashboardPageHeader, StatCard } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { requireSession } from "@/lib/auth/session"
import { getUserDashboardStats } from "@/lib/dashboard/stats"
import { getRoleLabel, type AppRole } from "@/lib/dashboard/nav"

export default async function DashboardPage() {
  const session = await requireSession()
  const role = ((session.user as { role?: string }).role ?? "user") as AppRole
  const stats = await getUserDashboardStats(session.user.id)

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Overview"
        description={`Welcome back, ${session.user.name}. Cosmetic guidance only — not a medical diagnosis.`}
        badge={getRoleLabel(role)}
      />

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-medium">Ready for a scan?</h2>
            <p className="text-sm text-muted-foreground">
              Capture or upload a photo for personalized cosmetic guidance and
              product recommendations.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/scan">
              <IconCamera className="size-4" />
              Start your scan
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Token balance" value={stats.balance.toLocaleString()} />
        <StatCard label="Lifetime used" value={stats.lifetimeUsed.toLocaleString()} hint="All time" />
        <StatCard label="Scans" value={stats.scanCount} />
        <StatCard
          label="Skin type"
          value={String(stats.profile?.skinType ?? "—")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Token usage (14 days)</h2>
          <p className="mt-1 text-xs text-muted-foreground">Debit activity from your wallet</p>
          <div className="mt-4">
            <UsageBarChart data={stats.dailyUsage} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Quick summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Location</dt>
              <dd>
                {stats.location?.city
                  ? `${stats.location.city}, ${stats.location.region}`
                  : "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Climate zone</dt>
              <dd>{stats.location?.climateZone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Primary concerns</dt>
              <dd className="text-right capitalize">
                {stats.profile?.primaryConcerns?.slice(0, 3).join(", ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tokens granted</dt>
              <dd>{stats.lifetimeGranted.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
