import { SkinTrendChart } from "@/components/dashboard/skin-trend-chart"
import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { StatCard } from "@/components/dashboard/page-header"
import { CompactNumber } from "@/components/ui/compact-number"
import { requireAuthContext } from "@/lib/auth/context"
import { getUserDashboardStats } from "@/lib/dashboard/stats"
import {
  getUserScanTrends,
  summarizeScanTrends,
} from "@/lib/dashboard/scan-trends"

export async function DashboardOverviewStats() {
  const ctx = await requireAuthContext()
  const [stats, trendPoints] = await Promise.all([
    getUserDashboardStats(ctx.userId),
    getUserScanTrends(ctx.userId),
  ])
  const trendSummary = summarizeScanTrends(trendPoints)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scans remaining" value={stats.remaining} />
        <StatCard
          label="Scans used"
          value={stats.lifetimeUsed}
          hint="All time"
        />
        <StatCard
          label="Chat budget"
          value={stats.chatBudgetRemaining}
          hint="Tokens for skin advice"
        />
        <StatCard
          label="Skin type"
          value={String(stats.profile?.skinType ?? "—")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Skin journey</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Overall band trend across your saved scans
          </p>
          <div className="mt-4">
            <SkinTrendChart points={trendPoints} />
          </div>
          {trendSummary.hasTrend ? (
            <dl className="mt-4 space-y-2 text-xs text-muted-foreground">
              {trendSummary.improvingDimensions.length > 0 ? (
                <div>
                  Improving: {trendSummary.improvingDimensions.join(", ")}
                </div>
              ) : null}
              {trendSummary.watchDimensions.length > 0 ? (
                <div>Watch areas: {trendSummary.watchDimensions.join(", ")}</div>
              ) : null}
            </dl>
          ) : null}
        </div>

        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Scans used (14 days)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            One scan debited per saved analysis
          </p>
          <div className="mt-4">
            <UsageBarChart data={stats.dailyUsage} />
          </div>
        </div>

        <div className="rounded-none border border-border bg-card p-5">
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
              <dt className="text-muted-foreground">Scans granted</dt>
              <dd>
                <CompactNumber value={stats.lifetimeGranted} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  )
}
